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
import {
  PurchaseEntry,
} from '../suppliers/purchase_entry/schemas/purchase-entry.schema';

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
    @InjectModel(PurchaseEntry.name)
    private purchaseEntryModel: Model<PurchaseEntry>,
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
      designation: body.designation || null,
      signature: body.signature || null,
      profilePic: body.profilePic || null,
      role: UserRole.DOCTOR,
      status: body.status || UserStatus.ACTIVE,
      availability: body.availability
        ? this.validateAvailability(body.availability)
        : null,
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
      ...(body.designation !== undefined && { designation: body.designation }),
      ...(body.signature !== undefined && { signature: body.signature }),
      ...(body.profilePic !== undefined && { profilePic: body.profilePic }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.availability !== undefined && {
        availability: this.validateAvailability(body.availability),
      }),
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

  /**
   * Validate doctor consultation availability (end ≥ start, rounds inside window,
   * non-overlapping rounds). Used by create/update and dedicated schedule CRUD.
   */
  validateAvailability(availability: any) {
    if (availability === null) return null;
    if (!availability || typeof availability !== 'object') {
      throw new BadRequestException('Invalid availability payload');
    }

    const { startTime, endTime, days, rounds, startDate, endDate } =
      availability;

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) {
        throw new BadRequestException(
          'Availability end date must be on or after start date',
        );
      }
    }

    if (startTime && endTime) {
      if (this.timeToMinutes(endTime) < this.timeToMinutes(startTime)) {
        throw new BadRequestException(
          'Availability end time must be on or after start time',
        );
      }
    }

    if (days && !Array.isArray(days)) {
      throw new BadRequestException('Availability days must be an array');
    }

    const normalizedRounds = Array.isArray(rounds) ? rounds : [];
    for (const round of normalizedRounds) {
      if (!round?.start || !round?.end) {
        throw new BadRequestException(
          'Each round/session must include start and end times',
        );
      }
      if (this.timeToMinutes(round.end) < this.timeToMinutes(round.start)) {
        throw new BadRequestException(
          `Round "${round.label || ''}" end must be on or after start`,
        );
      }
      if (startTime && endTime) {
        if (
          this.timeToMinutes(round.start) < this.timeToMinutes(startTime) ||
          this.timeToMinutes(round.end) > this.timeToMinutes(endTime)
        ) {
          throw new BadRequestException(
            `Round "${round.label || ''}" must fall within consultation hours`,
          );
        }
      }
    }

    // Detect overlapping rounds
    const sorted = [...normalizedRounds].sort(
      (a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (
        this.timeToMinutes(sorted[i].start) <
        this.timeToMinutes(sorted[i - 1].end)
      ) {
        throw new BadRequestException(
          'Consultation rounds/sessions overlap — adjust times',
        );
      }
    }

    const slotIntervalMinutes = Number(
      availability.slotIntervalMinutes ?? 15,
    );
    if (
      !Number.isFinite(slotIntervalMinutes) ||
      slotIntervalMinutes < 5 ||
      slotIntervalMinutes > 120
    ) {
      throw new BadRequestException(
        'slotIntervalMinutes must be between 5 and 120',
      );
    }

    return {
      startDate: availability.startDate ?? null,
      endDate: availability.endDate ?? null,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      days: Array.isArray(days) ? days : [],
      rounds: normalizedRounds,
      slotIntervalMinutes,
    };
  }

  private timeToMinutes(t: string): number {
    const [h, m] = String(t)
      .split(':')
      .map((n) => parseInt(n, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      throw new BadRequestException(`Invalid time value: ${t}`);
    }
    return h * 60 + m;
  }

  async updateDoctorAvailability(id: string, availability: any) {
    const validated =
      availability === null ? null : this.validateAvailability(availability);
    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), role: UserRole.DOCTOR },
        { availability: validated },
        { new: true },
      )
      .select('-password -refreshToken')
      .lean();
    if (!updated) {
      throw new NotFoundException('Doctor not found');
    }
    return updated;
  }

  async deleteDoctorAvailability(id: string) {
    return this.updateDoctorAvailability(id, null);
  }

  /**
   * Daily / monthly admin summary — reuses billing, P&L, purchase entry data.
   * Does not invent finance figures.
   */
  async getReportsSummary(query: {
    mode?: string;
    date?: string;
    month?: string;
    billingType?: string;
    paymentStatus?: string;
    department?: string;
  }) {
    const mode = query.mode === 'monthly' ? 'monthly' : 'daily';
    let start: Date;
    let end: Date;

    if (mode === 'monthly') {
      const monthStr =
        query.month ||
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const [y, m] = monthStr.split('-').map(Number);
      if (!y || !m) {
        throw new BadRequestException('month must be YYYY-MM');
      }
      start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      end = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      const day = query.date ? new Date(query.date) : new Date();
      if (Number.isNaN(day.getTime())) {
        throw new BadRequestException('date must be YYYY-MM-DD');
      }
      start = new Date(day);
      start.setHours(0, 0, 0, 0);
      end = new Date(day);
      end.setHours(23, 59, 59, 999);
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const billingBase: any = {
      createdAt: { $gte: start, $lte: end },
    };

    if (query.department && query.department !== 'All') {
      const targetRole =
        query.department === 'Lab' ? UserRole.LAB : UserRole.PHARMACY;
      const deptUsers = await this.userModel
        .find({ role: targetRole })
        .select('_id')
        .lean();
      billingBase.user = { $in: deptUsers.map((u) => u._id) };
    }

    if (query.paymentStatus && query.paymentStatus !== 'all') {
      // Derive payment status from cash/online vs item totals is complex;
      // reuse bill status Draft/Completed plus method heuristics via admin billing.
      if (query.paymentStatus === 'Draft' || query.paymentStatus === 'Completed') {
        billingBase.status = query.paymentStatus;
      }
    }

    const applyBillingType = (filter: any, billingType?: string) => {
      if (!billingType || billingType === 'all') return filter;
      const f = { ...filter };
      if (billingType === 'Sale') f.transactionType = 'Sale';
      else if (billingType === 'Return') f.transactionType = 'Return';
      else if (billingType === 'Lab')
        f.reportId = { $exists: true, $ne: null };
      else if (billingType === 'Consultation') {
        f['items.name'] = { $regex: /consultation/i };
      } else if (billingType === 'Dressing') {
        f['items.name'] = { $regex: /dressing/i };
      } else if (billingType === 'Clinical') {
        f['items.name'] = {
          $regex:
            /procedure|injection|cannulation|extraction|catheterisation|enema|dressing/i,
        };
      } else if (billingType === 'Pharmacy') {
        f['items.name'] = {
          $not: {
            $regex:
              /consultation|procedure|injection|cannulation|extraction|catheterisation|enema|dressing/i,
          },
        };
      }
      return f;
    };

    const types = [
      'all',
      'Consultation',
      'Clinical',
      'Dressing',
      'Pharmacy',
      'Lab',
      'Sale',
      'Return',
    ];

    const typeFilter = query.billingType || 'all';
    const salesFilter = applyBillingType(billingBase, typeFilter);

    const salesAgg = await this.billingModel.aggregate([
      { $match: salesFilter },
      {
        $group: {
          _id: null,
          billCount: { $sum: 1 },
          cash: { $sum: { $ifNull: ['$cash', 0] } },
          online: { $sum: { $ifNull: ['$online', 0] } },
          discount: { $sum: { $ifNull: ['$discount', 0] } },
          revenue: {
            $sum: {
              $add: [
                { $ifNull: ['$cash', 0] },
                { $ifNull: ['$online', 0] },
              ],
            },
          },
        },
      },
    ]);

    const byType: Record<string, any> = {};
    for (const t of types.filter((x) => x !== 'all')) {
      const f = applyBillingType(billingBase, t);
      const agg = await this.billingModel.aggregate([
        { $match: f },
        {
          $group: {
            _id: null,
            billCount: { $sum: 1 },
            revenue: {
              $sum: {
                $add: [
                  { $ifNull: ['$cash', 0] },
                  { $ifNull: ['$online', 0] },
                ],
              },
            },
          },
        },
      ]);
      byType[t] = agg[0] || { billCount: 0, revenue: 0 };
    }

    const purchaseAgg = this.purchaseEntryModel
      ? await this.purchaseEntryModel.aggregate([
          {
            $match: {
              invoiceDate: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              total: { $sum: { $ifNull: ['$total', 0] } },
              paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
            },
          },
        ])
      : [];

    // Supplier payments in period: entries updated in range with paidAmount > 0
    // (no separate payment ledger — documented limitation).
    const paymentsAgg = this.purchaseEntryModel
      ? await this.purchaseEntryModel.aggregate([
          {
            $match: {
              paidAmount: { $gt: 0 },
              updatedAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
            },
          },
        ])
      : [];

    const outstandingAgg = this.purchaseEntryModel
      ? await this.purchaseEntryModel.aggregate([
          {
            $group: {
              _id: null,
              outstanding: {
                $sum: {
                  $subtract: [
                    { $ifNull: ['$total', 0] },
                    { $ifNull: ['$paidAmount', 0] },
                  ],
                },
              },
            },
          },
        ])
      : [];

    const pnl = await this.getProfitAndLoss(startIso, endIso);
    const round2 = (n: number) =>
      Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
    const sales = salesAgg[0] || {
      billCount: 0,
      cash: 0,
      online: 0,
      discount: 0,
      revenue: 0,
    };
    const purchases = purchaseAgg[0] || { count: 0, total: 0, paidAmount: 0 };
    const payments = paymentsAgg[0] || { count: 0, paidAmount: 0 };

    return {
      mode,
      period: { startDate: startIso, endDate: endIso },
      filters: {
        billingType: typeFilter,
        paymentStatus: query.paymentStatus || 'all',
        department: query.department || 'All',
      },
      sales: {
        billCount: sales.billCount,
        cash: round2(sales.cash),
        online: round2(sales.online),
        discount: round2(sales.discount),
        revenue: round2(sales.revenue),
        byType,
      },
      purchases: {
        count: purchases.count,
        total: round2(purchases.total),
        paidOnInvoices: round2(purchases.paidAmount),
      },
      supplierPayments: {
        note: 'Derived from purchase entries with paidAmount > 0 updated in period (no separate payment ledger).',
        count: payments.count,
        paidAmount: round2(payments.paidAmount),
      },
      outstanding: {
        note: 'Point-in-time supplier outstanding (not historical as-of).',
        total: round2(outstandingAgg[0]?.outstanding || 0),
      },
      profit: pnl.profit,
      pnl,
    };
  }
}
