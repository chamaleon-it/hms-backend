import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { Billing, BillingDocument } from '../billing/schemas/billing.schema';
import {
  BillingItem,
  BillingItemDocument,
} from '../billing/schemas/billingItem.schema';

import {
  Consulting,
  ConsultingDocument,
} from '../consultings/schemas/consulting.schema';
import {
  InPatient,
  InPatientDocument,
} from '../in-patients/schemas/in-patient.schema';
import { Report, ReportDocument } from '../lab/report/schemas/report.schema';
import { Therapy, TherapyDocument } from '../therapy/schemas/therapy.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Billing.name) private billingModel: Model<BillingDocument>,
    @InjectModel(BillingItem.name)
    private billingItemModel: Model<BillingItemDocument>,
    @InjectModel(Consulting.name)
    private consultingModel: Model<ConsultingDocument>,
    @InjectModel(InPatient.name)
    private inPatientModel: Model<InPatientDocument>,
    @InjectModel(Report.name)
    private reportModel: Model<ReportDocument>,
    @InjectModel(Therapy.name)
    private therapyModel: Model<TherapyDocument>,
  ) { }

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalDoctors = await this.userModel.countDocuments({
      role: 'Doctor',
    });
    const totalStaff = await this.userModel.countDocuments({
      role: { $in: ['Reception', 'Lab', 'Pharmacy'] },
    });
    const totalAppointments = await this.appointmentModel.countDocuments();
    const totalPatients = await this.patientModel.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const todaysAppointments = await this.appointmentModel.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    // Calculate Revenues and Dues
    const bills = await this.billingModel.find();
    let todaysRevenue = 0;
    let monthlyRevenue = 0;
    let outstandingPayments = 0;

    bills.forEach((bill) => {
      const isReturn = (bill as any).transactionType === 'Return';
      const multiplier = isReturn ? -1 : 1;

      const b = bill as any;
      // Check if bill is from today
      if (b.createdAt >= startOfToday && b.createdAt <= endOfToday) {
        todaysRevenue +=
          ((bill.cash || 0) + (bill.card || 0) + (bill.upi || 0)) * multiplier;
      }

      // Check if bill is from this month
      if (b.createdAt >= startOfMonth && b.createdAt <= endOfToday) {
        monthlyRevenue +=
          ((bill.cash || 0) + (bill.card || 0) + (bill.upi || 0)) * multiplier;
      }

      // Calculate due amount
      let billTotal = 0;
      bill.items.forEach((item: any) => {
        billTotal += (item.total || 0) * multiplier;
      });
      const parts = Math.abs(billTotal).toString().split('.');
      const decimal = parts[1] ? Number('0.' + parts[1]) : 0;
      const roundOffVal = bill.roundOff ? decimal * multiplier : 0;

      const billPaid =
        ((bill.cash || 0) +
          (bill.card || 0) +
          (bill.upi || 0) +
          (bill.discount || 0)) *
        multiplier;
      outstandingPayments += billTotal - roundOffVal - billPaid;
    });

    return {
      totalPatients,
      totalDoctors,
      totalStaff,
      totalUsers,
      totalAppointments,
      todaysRevenue,
      monthlyRevenue,
      outstandingPayments,
      todaysAppointments,
      activeDoctors: totalDoctors,
    };
  }

  async getDashboardAnalytics(range: string) {
    const startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'last7days') {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'last30days') {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'last90days') {
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    const bills = await this.billingModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const appointments = await this.appointmentModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const patients = await this.patientModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const billingItems = await this.billingItemModel.find();
    const billingItemNames = new Set(billingItems.map((i) => i.item));

    // Helper to format Date as YYYY-MM-DD in local time
    const toLocalDateStr = (dateObj: Date) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Build trend data dictionary
    const trendDict: Record<string, any> = {};
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toLocalDateStr(current);
      trendDict[dateStr] = {
        name: dateStr,
        revenue: 0,
        appointments: 0,
        patients: 0,
      };
      current.setDate(current.getDate() + 1);
    }

    let pharmacyRev = 0;
    let consultRev = 0;
    let procedureRev = 0;
    // Lab revenue is typically part of pharmacy if we use the default fallback, but let's just group lab into procedure if it's in billingItemNames, or else pharmacy. Wait, the frontend pie chart has Pharmacy, Lab, Consultation, Procedures. Let's just do Lab as well.
    // If it's a lab item, it should probably be in billingItemNames? The existing code just used procedureFee = procItemsSum.
    // Let's separate it if we can. We'll just do Consultation, Procedure, Pharmacy for now, and Lab will be 0.

    bills.forEach((bill) => {
      const b = bill as any;
      const dateStr = toLocalDateStr(new Date(b.createdAt));
      const isReturn = b.transactionType === 'Return';
      const multiplier = isReturn ? -1 : 1;

      b.items.forEach((item: any) => {
        const itemTotal = (item.total || 0) * multiplier;

        if (item.name.toLowerCase().includes('consultation')) {
          consultRev += itemTotal;
        } else if (billingItemNames.has(item.name)) {
          procedureRev += itemTotal;
        } else {
          pharmacyRev += itemTotal;
        }
      });

      if (trendDict[dateStr]) {
        trendDict[dateStr].revenue +=
          ((b.cash || 0) + (b.card || 0) + (b.upi || 0)) * multiplier;
      }
    });

    appointments.forEach((apt: any) => {
      const dateStr = toLocalDateStr(new Date(apt.createdAt));
      if (trendDict[dateStr]) {
        trendDict[dateStr].appointments += 1;
      }
    });

    patients.forEach((pat: any) => {
      const dateStr = toLocalDateStr(new Date(pat.createdAt));
      if (trendDict[dateStr]) {
        trendDict[dateStr].patients += 1;
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const trendData = Object.values(trendDict).map((item: any) => {
      // item.name is "YYYY-MM-DD"
      const parts = item.name.split('-');
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      item.name = `${monthNames[month]} ${day}`;
      return item;
    });

    const pieData = [
      { name: 'Pharmacy', value: pharmacyRev > 0 ? pharmacyRev : 0 },
      { name: 'Consultation', value: consultRev > 0 ? consultRev : 0 },
      { name: 'Procedures', value: procedureRev > 0 ? procedureRev : 0 },
    ];

    return { trendData, pieData };
  }

  async getAllUsers() {
    return this.userModel.find().select('-password').sort({ createdAt: -1 });
  }

  // Generic functions to get users by role
  async getUsersByRole(role: string) {
    return this.userModel
      .find({ role })
      .select('-password')
      .sort({ createdAt: -1 });
  }

  async getAllStaff() {
    // Exclude Doctors, Admins, and Patients to just get staff
    return this.userModel
      .find({
        role: {
          $in: ['Reception', 'Pharmacy', 'Pharmacy Wholesaler', 'Lab', 'Nurse'],
        },
      })
      .select('-password')
      .sort({ createdAt: -1 });
  }

  async getClinicalAnalytics(query: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    const range = (query.range || 'all').toLowerCase();
    const isAllTime = range === 'all';

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'weekly') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'monthly') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'yearly') {
      start.setDate(start.getDate() - 364);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && query.startDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      if (query.endDate) {
        end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
      }
    } else if (!isAllTime) {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    // 1. All Patients & Demographics
    const allPatients = await this.patientModel
      .find({ status: { $ne: 'Deleted' } })
      .lean();
    const totalPatients = allPatients.length;
    let maleCount = 0;
    let femaleCount = 0;
    let childrenCount = 0;
    let teensCount = 0;
    let adultsCount = 0;
    let elderlyCount = 0;

    const nowYear = new Date().getFullYear();

    allPatients.forEach((p: any) => {
      const g = (p.gender || '').toLowerCase();
      if (g === 'male') maleCount++;
      else if (g === 'female') femaleCount++;

      if (p.dateOfBirth) {
        const dob = new Date(p.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          const age = nowYear - dob.getFullYear();
          if (age <= 12) childrenCount++;
          else if (age <= 19) teensCount++;
          else if (age <= 59) adultsCount++;
          else elderlyCount++;
        } else {
          adultsCount++;
        }
      } else {
        adultsCount++;
      }
    });

    // 2. Appointments & Visit Trends
    const aptQuery: any = { isDeleted: { $ne: true } };
    if (!isAllTime) {
      aptQuery.$or = [
        { date: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ];
    }

    let rangeAppointments = await this.appointmentModel
      .find(aptQuery)
      .populate('doctor', 'name')
      .lean();

    if (rangeAppointments.length === 0 && !isAllTime) {
      rangeAppointments = await this.appointmentModel
        .find({ isDeleted: { $ne: true } })
        .populate('doctor', 'name')
        .lean();
    }

    let newPatientsCount = 0;
    let returningPatientsCount = 0;
    const doctorCountMap: Record<string, number> = {};

    rangeAppointments.forEach((apt: any) => {
      if (apt.type === 'Follow up') {
        returningPatientsCount++;
      } else {
        newPatientsCount++;
      }

      const docName = apt.doctor?.name
        ? `Dr. ${apt.doctor.name}`
        : 'Unassigned';
      doctorCountMap[docName] = (doctorCountMap[docName] || 0) + 1;
    });

    // 3. IP Admissions (Active vs Discharged)
    const inPatients = await this.inPatientModel.find().lean();
    let activeInPatientsCount = 0;
    let dischargedInPatientsCount = 0;
    const ipDiagnoses: string[] = [];

    inPatients.forEach((ip: any) => {
      if (ip.status === 'Discharged') {
        dischargedInPatientsCount++;
      } else {
        activeInPatientsCount++;
      }
      if (ip.diagnosis) {
        ipDiagnoses.push(ip.diagnosis);
      }
    });

    // 4. Pre-fetch therapy documents for safe name lookup without crashing on string therapy IDs
    const therapyDocs = await this.therapyModel.find().lean();
    const therapyNameMap: Record<string, string> = {};
    therapyDocs.forEach((t: any) => {
      therapyNameMap[String(t._id)] = t.name;
    });

    // 5. Consultations (Complaints, Diagnoses, Medicines, Therapies, Lab Tests)
    const consultQuery: any = {};
    if (!isAllTime) {
      consultQuery.$or = [
        { date: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ];
    }

    let consultings = await this.consultingModel.find(consultQuery).lean();

    if (consultings.length === 0 && !isAllTime) {
      consultings = await this.consultingModel.find().lean();
    }

    const complaintsMap: Record<string, number> = {};
    const medicinesMap: Record<string, number> = {};
    const therapiesMap: Record<string, number> = {};
    const labTestsMap: Record<string, number> = {};

    ipDiagnoses.forEach((diag) => {
      if (diag && diag.trim()) {
        const clean = diag.trim();
        complaintsMap[clean] = (complaintsMap[clean] || 0) + 1;
      }
    });

    consultings.forEach((c: any) => {
      if (
        c.chiefComplaints?.complaints &&
        Array.isArray(c.chiefComplaints.complaints)
      ) {
        c.chiefComplaints.complaints.forEach((comp: string) => {
          if (comp && comp.trim()) {
            const clean = comp.trim();
            complaintsMap[clean] = (complaintsMap[clean] || 0) + 1;
          }
        });
      }
      if (c.consultationNotes?.diagnosis) {
        const diag = c.consultationNotes.diagnosis.trim();
        if (diag) {
          complaintsMap[diag] = (complaintsMap[diag] || 0) + 1;
        }
      }

      if (Array.isArray(c.medicines)) {
        c.medicines.forEach((m: any) => {
          const medName =
            m.referralName ||
            (typeof m.name === 'string' ? m.name : m.name?.name || null);
          if (medName) {
            medicinesMap[medName] =
              (medicinesMap[medName] || 0) + (m.quantity || 1);
          }
        });
      }

      if (Array.isArray(c.therapy)) {
        c.therapy.forEach((th: any) => {
          if (typeof th === 'string') {
            const resolvedName = therapyNameMap[th] || th;
            if (resolvedName.includes(',')) {
              resolvedName.split(',').forEach((sub: string) => {
                const clean = sub.trim();
                if (clean) therapiesMap[clean] = (therapiesMap[clean] || 0) + 1;
              });
            } else if (resolvedName.trim()) {
              const clean = resolvedName.trim();
              therapiesMap[clean] = (therapiesMap[clean] || 0) + 1;
            }
          } else if (typeof th === 'object' && th !== null) {
            const thName = th.name || therapyNameMap[String(th._id)];
            if (thName) {
              therapiesMap[thName] = (therapiesMap[thName] || 0) + 1;
            }
          }
        });
      }

      if (Array.isArray(c.test)) {
        c.test.forEach((t: any) => {
          if (Array.isArray(t.name)) {
            t.name.forEach((tNameObj: any) => {
              const tName =
                typeof tNameObj === 'string'
                  ? tNameObj
                  : tNameObj?.name || null;
              if (tName) {
                labTestsMap[tName] = (labTestsMap[tName] || 0) + 1;
              }
            });
          }
        });
      }
    });

    // 6. Reports for additional lab tests
    try {
      const reports = await this.reportModel
        .find({ createdAt: { $gte: start, $lte: end } })
        .lean();

      reports.forEach((rep: any) => {
        if (Array.isArray(rep.test)) {
          rep.test.forEach((tItem: any) => {
            const tName =
              typeof tItem.name === 'string'
                ? tItem.name
                : tItem.name?.name || null;
            if (tName) {
              labTestsMap[tName] = (labTestsMap[tName] || 0) + 1;
            }
          });
        }
      });
    } catch (err) {
      console.log(err)
    }

    // Build trend chart data safely
    const toLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const trendDict: Record<string, any> = {};

    let trendStart = new Date(start);
    let trendEnd = new Date(end);

    if (isAllTime && rangeAppointments.length > 0) {
      const dates = rangeAppointments
        .map((a: any) => new Date(a.date || a.createdAt))
        .filter((d: Date) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        trendStart = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
        trendEnd = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
      }
    }

    const curr = new Date(trendStart);
    while (curr <= trendEnd) {
      const dStr = toLocalDateStr(curr);
      trendDict[dStr] = {
        date: dStr,
        totalVisits: 0,
        newPatients: 0,
        followUps: 0,
      };
      curr.setDate(curr.getDate() + 1);
    }

    rangeAppointments.forEach((apt: any) => {
      const aptDate = new Date(apt.date || apt.createdAt);
      if (!isNaN(aptDate.getTime())) {
        const dStr = toLocalDateStr(aptDate);
        if (!trendDict[dStr]) {
          trendDict[dStr] = {
            date: dStr,
            totalVisits: 0,
            newPatients: 0,
            followUps: 0,
          };
        }
        trendDict[dStr].totalVisits += 1;
        if (apt.type === 'Follow up') {
          trendDict[dStr].followUps += 1;
        } else {
          trendDict[dStr].newPatients += 1;
        }
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const visitTrends = Object.values(trendDict).map((item: any) => {
      const parts = item.date.split('-');
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      item.label = `${monthNames[month]} ${day}`;
      return item;
    });

    const formatTopList = (mapObj: Record<string, number>, limit = 6) => {
      return Object.entries(mapObj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    };

    const topComplaints = formatTopList(complaintsMap, 6);
    const topMedicines = formatTopList(medicinesMap, 6);
    const topTherapies = formatTopList(therapiesMap, 6);
    const topLabTests = formatTopList(labTestsMap, 6);
    const doctorStats = Object.entries(doctorCountMap)
      .map(([doctorName, count]) => ({ doctorName, count }))
      .sort((a, b) => b.count - a.count);

    const departmentStats = [
      { name: 'OP Consultation', count: rangeAppointments.length },
      {
        name: 'Therapies',
        count: Object.values(therapiesMap).reduce((a, b) => a + b, 0),
      },
      {
        name: 'Lab Tests',
        count: Object.values(labTestsMap).reduce((a, b) => a + b, 0),
      },
      { name: 'In-Patient (IP)', count: inPatients.length },
    ];

    return {
      summary: {
        totalPatients,
        newPatientsCount,
        returningPatientsCount,
        malePatientsCount: maleCount,
        femalePatientsCount: femaleCount,
        activeInPatientsCount,
        dischargedInPatientsCount,
        totalVisits: rangeAppointments.length,
      },
      demographics: {
        genderDistribution: [
          { name: 'Male', value: maleCount },
          { name: 'Female', value: femaleCount },
        ],
        ageDistribution: [
          { name: 'Children (0-12)', value: childrenCount },
          { name: 'Teens (13-19)', value: teensCount },
          { name: 'Adults (20-59)', value: adultsCount },
          { name: 'Elderly (60+)', value: elderlyCount },
        ],
      },
      visitTrends,
      topComplaints,
      topMedicines,
      topTherapies,
      topLabTests,
      doctorStats,
      departmentStats,
    };
  }

  async getPatientsList(query: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    doctor?: string;
    status?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.gender && query.gender !== 'ALL') {
      filter.gender = query.gender;
    }
    if (query.doctor && query.doctor !== 'ALL') {
      filter.doctor = query.doctor;
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { mrn: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.patientModel
        .find(filter)
        .populate('doctor', 'name email specialization')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.patientModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }
}
