import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { Billing, BillingDocument } from '../billing/schemas/billing.schema';
import { BillingItem, BillingItemDocument } from '../billing/schemas/billingItem.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Billing.name) private billingModel: Model<BillingDocument>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItemDocument>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalDoctors = await this.userModel.countDocuments({ role: 'Doctor' });
    const totalStaff = await this.userModel.countDocuments({ role: { $in: ['Reception', 'Lab', 'Pharmacy'] } });
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
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    // Calculate Revenues and Dues
    const bills = await this.billingModel.find();
    let todaysRevenue = 0;
    let monthlyRevenue = 0;
    let outstandingPayments = 0;

    bills.forEach(bill => {
      const isReturn = (bill as any).transactionType === "Return";
      const multiplier = isReturn ? -1 : 1;

      const b = bill as any;
      // Check if bill is from today
      if (b.createdAt >= startOfToday && b.createdAt <= endOfToday) {
        todaysRevenue += ((bill.cash || 0) + (bill.card || 0) + (bill.upi || 0)) * multiplier;
      }

      // Check if bill is from this month
      if (b.createdAt >= startOfMonth && b.createdAt <= endOfToday) {
        monthlyRevenue += ((bill.cash || 0) + (bill.card || 0) + (bill.upi || 0)) * multiplier;
      }

      // Calculate due amount
      let billTotal = 0;
      bill.items.forEach((item: any) => {
        billTotal += (item.total || 0) * multiplier;
      });
      const parts = Math.abs(billTotal).toString().split(".");
      const decimal = parts[1] ? Number("0." + parts[1]) : 0;
      const roundOffVal = bill.roundOff ? decimal * multiplier : 0;
      
      const billPaid = ((bill.cash || 0) + (bill.card || 0) + (bill.upi || 0) + (bill.discount || 0)) * multiplier;
      outstandingPayments += (billTotal - roundOffVal - billPaid);
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
    let startDate = new Date();
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

    const bills = await this.billingModel.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const appointments = await this.appointmentModel.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const patients = await this.patientModel.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const billingItems = await this.billingItemModel.find();
    const billingItemNames = new Set(billingItems.map(i => i.item));

    // Helper to format Date as YYYY-MM-DD in local time
    const toLocalDateStr = (dateObj: Date) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Build trend data dictionary
    const trendDict: Record<string, any> = {};
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toLocalDateStr(current);
      trendDict[dateStr] = { name: dateStr, revenue: 0, appointments: 0, patients: 0 };
      current.setDate(current.getDate() + 1);
    }

    let pharmacyRev = 0;
    let consultRev = 0;
    let procedureRev = 0;
    // Lab revenue is typically part of pharmacy if we use the default fallback, but let's just group lab into procedure if it's in billingItemNames, or else pharmacy. Wait, the frontend pie chart has Pharmacy, Lab, Consultation, Procedures. Let's just do Lab as well.
    // If it's a lab item, it should probably be in billingItemNames? The existing code just used procedureFee = procItemsSum.
    // Let's separate it if we can. We'll just do Consultation, Procedure, Pharmacy for now, and Lab will be 0.
    
    bills.forEach(bill => {
      const b = bill as any;
      const dateStr = toLocalDateStr(new Date(b.createdAt));
      const isReturn = b.transactionType === "Return";
      const multiplier = isReturn ? -1 : 1;
      
      b.items.forEach((item: any) => {
        const itemTotal = (item.total || 0) * multiplier;

        if (item.name.toLowerCase().includes("consultation")) {
          consultRev += itemTotal;
        } else if (billingItemNames.has(item.name)) {
          procedureRev += itemTotal;
        } else {
          pharmacyRev += itemTotal;
        }
      });

      if (trendDict[dateStr]) {
        trendDict[dateStr].revenue += ((b.cash || 0) + (b.card || 0) + (b.upi || 0)) * multiplier;
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

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = Object.values(trendDict).map((item: any) => {
       // item.name is "YYYY-MM-DD"
       const parts = item.name.split('-');
       const month = parseInt(parts[1], 10) - 1;
       const day = parts[2];
       item.name = `${monthNames[month]} ${day}`;
       return item;
    });

    const pieData = [
      { name: "Pharmacy", value: pharmacyRev > 0 ? pharmacyRev : 0 },
      { name: "Consultation", value: consultRev > 0 ? consultRev : 0 },
      { name: "Procedures", value: procedureRev > 0 ? procedureRev : 0 },
    ];

    return { trendData, pieData };
  }

  async getAllUsers() {
    return this.userModel.find().select('-password').sort({ createdAt: -1 });
  }

  // Generic functions to get users by role
  async getUsersByRole(role: string) {
    return this.userModel.find({ role }).select('-password').sort({ createdAt: -1 });
  }

  async getAllStaff() {
    // Exclude Doctors, Admins, and Patients to just get staff
    return this.userModel.find({ 
      role: { $in: ['Reception', 'Pharmacy', 'Pharmacy Wholesaler', 'Lab', 'Nurse'] } 
    }).select('-password').sort({ createdAt: -1 });
  }
}
