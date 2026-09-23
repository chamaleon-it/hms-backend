import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from '../users/schemas/user.schema';
import { Billing, BillingDocument } from '../billing/schemas/billing.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { Pharmacist, PharmacistDocument } from '../pharmacy/pharmacist/schemas/pharmacist.schema';
import { Technician, TechnicianDocument } from '../lab/technician/schemas/technician.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { Item, ItemDocument } from '../pharmacy/items/schemas/item.schema';
import {
  ConsumableIssue,
  ConsumableIssueDocument,
} from '../pharmacy/consumables/schemas/consumable-issue.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Billing.name) private billingModel: Model<BillingDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Pharmacist.name) private pharmacistModel: Model<PharmacistDocument>,
    @InjectModel(Technician.name) private technicianModel: Model<TechnicianDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    @InjectModel(ConsumableIssue.name)
    private consumableIssueModel: Model<ConsumableIssueDocument>,
  ) {}

  async getDashboardStats() {
    const [
      totalDoctors,
      totalPharmacists,
      totalTechnicians,
      totalPatients,
      totalAppointments,
      totalBillsCount,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.DOCTOR }),
      this.pharmacistModel.countDocuments({ isDeleted: false }),
      this.technicianModel.countDocuments({ isDeleted: false }),
      this.patientModel.countDocuments(),
      this.appointmentModel.countDocuments(),
      this.billingModel.countDocuments(),
    ]);

    // Aggregate overall revenue
    const revenueAgg = await this.billingModel.aggregate([
      { $match: { transactionType: 'Sale' } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ['$cash', 0] },
                { $ifNull: ['$online', 0] },
                { $ifNull: ['$insurance', 0] },
              ],
            },
          },
          totalCash: { $sum: { $ifNull: ['$cash', 0] } },
          totalOnline: { $sum: { $ifNull: ['$online', 0] } },
          totalInsurance: { $sum: { $ifNull: ['$insurance', 0] } },
        },
      },
    ]);

    const revenue = revenueAgg[0] || {
      totalRevenue: 0,
      totalCash: 0,
      totalOnline: 0,
      totalInsurance: 0,
    };

    // Aggregate monthly revenue for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await this.billingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          transactionType: 'Sale',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'creator',
        },
      },
      {
        $unwind: { path: '$creator', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          amount: {
            $add: [
              { $ifNull: ['$cash', 0] },
              { $ifNull: ['$online', 0] },
              { $ifNull: ['$insurance', 0] },
            ],
          },
          role: '$creator.role',
        },
      },
      {
        $group: {
          _id: { month: '$month', year: '$year', role: '$role' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthlyMap: Record<string, { name: string; pharmacy: number; lab: number; total: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyMap[key] = {
        name: monthNames[d.getMonth()],
        pharmacy: 0,
        lab: 0,
        total: 0,
      };
    }

    monthlyAgg.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyMap[key]) {
        const amt = item.total || 0;
        monthlyMap[key].total += amt;
        if (item._id.role === UserRole.LAB) {
          monthlyMap[key].lab += amt;
        } else {
          monthlyMap[key].pharmacy += amt;
        }
      }
    });

    // Recent activity (latest 8 bills)
    const recentBills = await this.billingModel
      .find()
      .populate('patient', 'name mrn phone')
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return {
      stats: {
        totalRevenue: revenue.totalRevenue,
        totalCash: revenue.totalCash,
        totalOnline: revenue.totalOnline,
        totalInsurance: revenue.totalInsurance,
        totalDoctors,
        totalPharmacists,
        totalTechnicians,
        totalPatients,
        totalAppointments,
        totalBillsCount,
      },
      monthlyAnalytics: Object.values(monthlyMap),
      recentActivity: recentBills,
    };
  }

  // --- Doctor Management ---
  async getDoctors() {
    return this.userModel
      .find({ role: UserRole.DOCTOR })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getDoctorById(id: string) {
    const doctor = await this.userModel
      .findOne({ _id: new Types.ObjectId(id), role: UserRole.DOCTOR })
      .select('-password -refreshToken')
      .lean();
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async createDoctor(body: any) {
    const existing = await this.userModel.findOne({
      email: body.email.toLowerCase().trim(),
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(body.password || 'Doctor@123', 10);

    const newDoctor = new this.userModel({
      name: body.name,
      email: body.email.toLowerCase().trim(),
      password: hashedPassword,
      phoneNumber: body.phoneNumber || null,
      address: body.address || null,
      hospital: body.hospital || null,
      specialization: body.specialization || null,
      qualification: body.qualification || null,
      signature: body.signature || null,
      profilePic: body.profilePic || null,
      role: UserRole.DOCTOR,
      status: body.status || UserStatus.ACTIVE,
      availability: body.availability || null,
      emailVerified: true,
    });

    const saved = await newDoctor.save();
    const result = saved.toObject();
    delete (result as any).password;
    delete (result as any).refreshToken;
    return result;
  }

  async updateDoctor(id: string, body: any) {
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.hospital !== undefined && { hospital: body.hospital }),
      ...(body.specialization !== undefined && { specialization: body.specialization }),
      ...(body.qualification !== undefined && { qualification: body.qualification }),
      ...(body.signature !== undefined && { signature: body.signature }),
      ...(body.profilePic !== undefined && { profilePic: body.profilePic }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.availability !== undefined && { availability: body.availability }),
    };

    if (body.password && body.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(body.password.trim(), 10);
    }

    if (body.email) {
      const emailLower = body.email.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({
        email: emailLower,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (duplicate) {
        throw new BadRequestException('Email is already taken by another user.');
      }
      updateData.email = emailLower;
    }

    const updated = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateData, { new: true })
      .select('-password -refreshToken')
      .lean();

    if (!updated) {
      throw new NotFoundException('Doctor not found');
    }

    return updated;
  }

  async deleteDoctor(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(new Types.ObjectId(id));
    if (!deleted) {
      throw new NotFoundException('Doctor not found');
    }
    return { success: true, message: 'Doctor removed successfully' };
  }

  // --- Unified Billing ---
  async getAdminBilling(query: {
    department?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
    page?: string | number;
    limit?: string | number;
    billingType?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.method && query.method !== 'all') {
      if (query.method === 'Cash') filter.cash = { $gt: 0 };
      else if (query.method === 'Online') filter.online = { $gt: 0 };
      else if (query.method === 'Insurance') filter.insurance = { $gt: 0 };
    }

    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    // Match patient name or bill MRN if query.q is present
    let patientIds: Types.ObjectId[] = [];
    if (query.q && query.q.trim()) {
      const qTrim = query.q.trim();
      const patients = await this.patientModel
        .find({
          $or: [
            { name: { $regex: qTrim, $options: 'i' } },
            { mrn: { $regex: qTrim, $options: 'i' } },
            { phone: { $regex: qTrim, $options: 'i' } },
          ],
        })
        .select('_id')
        .lean();
      patientIds = patients.map((p) => p._id);

      filter.$or = [
        { mrn: { $regex: qTrim, $options: 'i' } },
        { patient: { $in: patientIds } },
      ];
    }

    // Department filter (Pharmacy vs Lab)
    if (query.department && query.department !== 'All') {
      const targetRole =
        query.department === 'Lab' ? UserRole.LAB : UserRole.PHARMACY;
      const deptUsers = await this.userModel
        .find({ role: targetRole })
        .select('_id')
        .lean();
      const deptUserIds = deptUsers.map((u) => u._id);
      filter.user = { $in: deptUserIds };
    }

    const billingType = query.billingType;
    if (billingType && billingType !== 'all') {
      if (billingType === 'Sale') filter.transactionType = 'Sale';
      else if (billingType === 'Return') filter.transactionType = 'Return';
      else if (billingType === 'Lab')
        filter.reportId = { $exists: true, $ne: null };
      else if (billingType === 'Consultation') {
        filter['items.name'] = { $regex: /consultation/i };
      } else if (billingType === 'Dressing') {
        filter['items.name'] = { $regex: /dressing/i };
      } else if (billingType === 'Clinical') {
        filter['items.name'] = {
          $regex:
            /procedure|injection|cannulation|extraction|catheterisation|enema|dressing/i,
        };
      } else if (billingType === 'Pharmacy') {
        // Exclude consultation/clinical keyword lines; include non-catalogue style names
        filter['items.name'] = {
          $not: {
            $regex:
              /consultation|procedure|injection|cannulation|extraction|catheterisation|enema|dressing/i,
          },
        };
      }
    }

    const [bills, total, totalsAgg] = await Promise.all([
      this.billingModel
        .find(filter)
        .populate('patient', 'name mrn phone age gender')
        .populate('user', 'name role email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.billingModel.countDocuments(filter),
      this.billingModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ['$cash', 0] },
                  { $ifNull: ['$online', 0] },
                  { $ifNull: ['$insurance', 0] },
                ],
              },
            },
            totalCash: { $sum: { $ifNull: ['$cash', 0] } },
            totalOnline: { $sum: { $ifNull: ['$online', 0] } },
            totalInsurance: { $sum: { $ifNull: ['$insurance', 0] } },
          },
        },
      ]),
    ]);

    return {
      data: bills,
      total,
      page,
      limit,
      totals: totalsAgg[0] || {
        totalRevenue: 0,
        totalCash: 0,
        totalOnline: 0,
        totalInsurance: 0,
      },
    };
  }

  /**
   * Profit & Loss for a date range.
   * Revenue = billing cash + online (sales only).
   * COGS = item soldHistory totals priced at purchasePrice (or sold unitPrice fallback).
   * Consumable expense = issued consumables cost (not sales).
   * Does not invent other operating expenses.
   */
  async getProfitAndLoss(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    end.setHours(23, 59, 59, 999);

    const round2 = (n: number) =>
      Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

    const [revenueAgg, cogsAgg, consumableAgg, billCount] = await Promise.all([
      this.billingModel.aggregate([
        {
          $match: {
            transactionType: 'Sale',
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'owner',
          },
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalCash: { $sum: { $ifNull: ['$cash', 0] } },
            totalOnline: { $sum: { $ifNull: ['$online', 0] } },
            totalDiscount: { $sum: { $ifNull: ['$discount', 0] } },
            pharmacyRevenue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$owner.role', UserRole.PHARMACY] },
                      { $eq: ['$owner.role', UserRole.ADMIN] },
                      { $eq: ['$owner.role', UserRole.SUPER_ADMIN] },
                      { $and: [{ $ne: ['$owner.role', UserRole.LAB] }, { $not: ['$reportId'] }] },
                    ],
                  },
                  {
                    $add: [
                      { $ifNull: ['$cash', 0] },
                      { $ifNull: ['$online', 0] },
                    ],
                  },
                  0,
                ],
              },
            },
            labRevenue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$owner.role', UserRole.LAB] },
                      { $ifNull: ['$reportId', false] },
                    ],
                  },
                  {
                    $add: [
                      { $ifNull: ['$cash', 0] },
                      { $ifNull: ['$online', 0] },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.itemModel.aggregate([
        { $unwind: { path: '$soldHistory', preserveNullAndEmptyArrays: false } },
        {
          $match: {
            'soldHistory.date': { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            cogs: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$soldHistory.quantity', 0] },
                  {
                    $cond: [
                      { $gt: [{ $ifNull: ['$purchasePrice', 0] }, 0] },
                      '$purchasePrice',
                      { $ifNull: ['$soldHistory.unitPrice', 0] },
                    ],
                  },
                ],
              },
            },
            unitsSold: { $sum: { $ifNull: ['$soldHistory.quantity', 0] } },
            salesValue: { $sum: { $ifNull: ['$soldHistory.total', 0] } },
          },
        },
      ]),
      this.consumableIssueModel.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalCost: { $sum: { $ifNull: ['$totalCost', 0] } },
            quantity: { $sum: { $ifNull: ['$quantity', 0] } },
          },
        },
      ]),
      this.billingModel.countDocuments({
        transactionType: 'Sale',
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    const revenue = revenueAgg[0] || {
      totalCash: 0,
      totalOnline: 0,
      totalDiscount: 0,
      pharmacyRevenue: 0,
      labRevenue: 0,
    };
    const cogs = cogsAgg[0] || { cogs: 0, unitsSold: 0, salesValue: 0 };
    const consumables = consumableAgg[0] || { totalCost: 0, quantity: 0 };

    const totalRevenue = round2(
      (revenue.totalCash || 0) + (revenue.totalOnline || 0),
    );
    const costOfGoodsSold = round2(cogs.cogs || 0);
    const consumableExpense = round2(consumables.totalCost || 0);
    const grossProfit = round2(totalRevenue - costOfGoodsSold);
    const netProfit = round2(grossProfit - consumableExpense);

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      revenue: {
        cash: round2(revenue.totalCash || 0),
        online: round2(revenue.totalOnline || 0),
        discount: round2(revenue.totalDiscount || 0),
        pharmacy: round2(revenue.pharmacyRevenue || 0),
        lab: round2(revenue.labRevenue || 0),
        total: totalRevenue,
        billCount,
      },
      costs: {
        cogs: costOfGoodsSold,
        unitsSold: cogs.unitsSold || 0,
        pharmacySalesValue: round2(cogs.salesValue || 0),
        consumables: consumableExpense,
        consumableUnits: consumables.quantity || 0,
        note: 'No other operating expenses are recorded in the system.',
      },
      profit: {
        grossProfit,
        netProfit,
        grossMarginPct:
          totalRevenue > 0
            ? round2((grossProfit / totalRevenue) * 100)
            : 0,
        netMarginPct:
          totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0,
      },
    };
  }
}
