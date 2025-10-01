// controllers/adminController.js - Complete with verification and dues overview
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import Collection from '../models/Collection.js';
import { sendVerificationEmail } from '../utils/emailService.js';

const MONTHLY_FEE = 3000;

const getMonths = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthIndex = (monthName) => {
  return getMonths().indexOf(monthName);
};

const getMonthsFromRegistration = (startMonth, startYear, endMonth, endYear) => {
  const months = getMonths();
  const result = [];
  
  let currentYear = startYear;
  let currentMonthIndex = getMonthIndex(startMonth);
  const endMonthIndex = getMonthIndex(endMonth);
  
  while (currentYear < endYear || (currentYear === endYear && currentMonthIndex <= endMonthIndex)) {
    result.push(`${months[currentMonthIndex]} ${currentYear}`);
    currentMonthIndex++;
    
    if (currentMonthIndex >= 12) {
      currentMonthIndex = 0;
      currentYear++;
    }
  }
  
  return result;
};

const calculateUserDuesFromRegistration = (user) => {
  if (!user.paymentTrackingStartMonth) return { totalDues: 0, monthsUnpaid: 0, unpaidMonths: [] };
  
  const [startMonthName, startYearStr] = user.paymentTrackingStartMonth.split(' ');
  const startYear = parseInt(startYearStr);
  
  const now = new Date();
  const currentMonthName = getMonths()[now.getMonth()];
  const currentYear = now.getFullYear();
  
  const requiredMonths = getMonthsFromRegistration(startMonthName, startYear, currentMonthName, currentYear);
  
  const validPayments = (user.paymentStatus || []).filter(payment => {
    return requiredMonths.includes(payment.month);
  });
  
  const paidMonths = validPayments.filter(p => p.status === 'Paid').map(p => p.month);
  const unpaidMonths = requiredMonths.filter(month => !paidMonths.includes(month));
  
  return {
    totalDues: unpaidMonths.length * MONTHLY_FEE,
    monthsUnpaid: unpaidMonths.length,
    unpaidMonths
  };
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }, '-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({}, '-password');
    res.status(200).json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const addTeamMember = async (req, res) => {
  const { name, email, phoneNumber, nic, password } = req.body;

  try {
    const existingTeamMember = await TeamMember.findOne({ email });
    if (existingTeamMember) {
      return res.status(400).json({ msg: 'Team member already exists with this email' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const newTeamMember = new TeamMember({
      name,
      email,
      phoneNumber,
      nic,
      password: hashedPassword,
      verified: false,
      verificationToken,
      verificationTokenExpiry: tokenExpiry
    });

    await newTeamMember.save();

    try {
      const emailResult = await sendVerificationEmail(email, name, verificationToken);
      if (emailResult.success) {
        console.log(`Verification email sent to team member: ${email}`);
      } else {
        console.log(`Failed to send verification email to team member: ${email}`);
      }
    } catch (emailError) {
      console.log('Verification email error:', emailError.message);
    }

    res.status(201).json({ 
      msg: 'Team member added successfully. Verification email sent.',
      teamMember: {
        id: newTeamMember._id,
        name: newTeamMember.name,
        email: newTeamMember.email,
        verified: newTeamMember.verified
      }
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ msg: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ msg: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteTeamMember = async (req, res) => {
  const { teamMemberId } = req.params;

  try {
    const teamMember = await TeamMember.findById(teamMemberId);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    await TeamMember.findByIdAndDelete(teamMemberId);
    res.status(200).json({ msg: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateUserRecord = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ msg: 'Cannot update admin user through this endpoint' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.status(200).json({ msg: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = getMonths()[new Date().getMonth()];
    
    const users = await User.find({ role: 'user' });
    const totalUsers = users.length;
    
    let currentMonthPaid = 0;
    let currentMonthDue = 0;
    let totalOverdueUsers = 0;
    let totalOutstandingAmount = 0;

    users.forEach(user => {
      const duesData = calculateUserDuesFromRegistration(user);
      const currentMonthStr = `${currentMonth} ${currentYear}`;
      
      if (user.paymentTrackingStartMonth) {
        const [startMonth, startYear] = user.paymentTrackingStartMonth.split(' ');
        const userStartYear = parseInt(startYear);
        const userStartMonthIndex = getMonthIndex(startMonth);
        const currentMonthIndex = getMonthIndex(currentMonth);
        
        const shouldPayCurrentMonth = (currentYear > userStartYear) || 
                                     (currentYear === userStartYear && currentMonthIndex >= userStartMonthIndex);
        
        if (shouldPayCurrentMonth) {
          const currentMonthPayment = (user.paymentStatus || []).find(p => p.month === currentMonthStr);
          if (currentMonthPayment && currentMonthPayment.status === 'Paid') {
            currentMonthPaid++;
          } else {
            currentMonthDue++;
          }
        }
      }
      
      if (duesData.totalDues > 0) {
        totalOverdueUsers++;
        totalOutstandingAmount += duesData.totalDues;
      }
    });

    const currentYearCollection = await Collection.findOne({ year: currentYear });
    const totalCollected = currentYearCollection ? currentYearCollection.totalAmount : 0;

    const teamMembers = await TeamMember.find({});

    res.json({
      currentMonth: `${currentMonth} ${currentYear}`,
      totalUsers,
      currentMonthStats: {
        paid: currentMonthPaid,
        due: currentMonthDue,
        collectionRate: (currentMonthPaid + currentMonthDue) > 0 ? Math.round((currentMonthPaid / (currentMonthPaid + currentMonthDue)) * 100) : 0
      },
      yearlyStats: {
        year: currentYear,
        totalCollected,
        totalOutstanding: totalOutstandingAmount,
        overdueUsers: totalOverdueUsers
      },
      teamMembersCount: teamMembers.length,
      monthlyFee: MONTHLY_FEE
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getYearlyReport = async (req, res) => {
  try {
    const { year } = req.params;
    const requestedYear = parseInt(year) || new Date().getFullYear();
    
    const collection = await Collection.findOne({ year: requestedYear });
    
    if (!collection) {
      return res.json({
        year: requestedYear,
        totalAmount: 0,
        monthlyBreakdown: getMonths().map(month => ({
          month,
          amount: 0,
          paymentsCount: 0
        })),
        summary: {
          totalUsers: 0,
          averageCollection: 0,
          collectionRate: 0
        }
      });
    }

    const users = await User.find({ role: 'user' });
    const totalUsers = users.length;
    
    const totalPayments = collection.monthlyBreakdown.reduce((sum, month) => sum + month.paymentsCount, 0);
    const averageCollection = totalUsers > 0 ? collection.totalAmount / 12 : 0;
    const maxPossibleCollection = totalUsers * 12 * MONTHLY_FEE;
    const collectionRate = maxPossibleCollection > 0 ? Math.round((collection.totalAmount / maxPossibleCollection) * 100) : 0;

    res.json({
      year: requestedYear,
      totalAmount: collection.totalAmount,
      monthlyBreakdown: collection.monthlyBreakdown,
      summary: {
        totalUsers,
        totalPayments,
        averageCollection: Math.round(averageCollection),
        collectionRate,
        maxPossibleCollection
      },
      monthlyFee: MONTHLY_FEE
    });
  } catch (error) {
    console.error('Error fetching yearly report:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAvailableYears = async (req, res) => {
  try {
    const collections = await Collection.find({}, 'year totalAmount').sort({ year: -1 });
    const years = collections.map(c => ({
      year: c.year,
      totalAmount: c.totalAmount
    }));
    
    const currentYear = new Date().getFullYear();
    if (!years.find(y => y.year === currentYear)) {
      years.unshift({ year: currentYear, totalAmount: 0 });
    }
    
    res.json(years);
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getUsersWithDues = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }, '-password');
    
    const usersWithDues = users.map(user => {
      const duesData = calculateUserDuesFromRegistration(user);
      
      return {
        _id: user._id,
        name: user.name,
        houseNo: user.houseNo,
        email: user.email,
        phoneNumber: user.phoneNumber,
        whatsappNumber: user.whatsappNumber,
        totalDues: duesData.totalDues,
        monthsUnpaid: duesData.monthsUnpaid,
        unpaidMonths: duesData.unpaidMonths,
        isOverdue: duesData.monthsUnpaid > 0,
        paymentTrackingStartMonth: user.paymentTrackingStartMonth,
        registrationDate: user.registrationDate
      };
    }).filter(user => user.isOverdue);

    usersWithDues.sort((a, b) => b.monthsUnpaid - a.monthsUnpaid);

    res.json(usersWithDues);
  } catch (error) {
    console.error('Error fetching users with dues:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getMonthPaymentDetails = async (req, res) => {
  try {
    const { year, month } = req.params;
    const users = await User.find({ role: 'user' }, '-password');
    
    const monthString = `${month} ${year}`;
    const usersWhoPaid = [];
    let totalAmount = 0;
    let paymentsCount = 0;
    
    users.forEach(user => {
      const payment = (user.paymentStatus || []).find(
        p => p.month === monthString && p.status === 'Paid'
      );
      
      if (payment) {
        usersWhoPaid.push({
          name: user.name,
          houseNo: user.houseNo,
          email: user.email,
          amount: payment.amount || MONTHLY_FEE,
          paidDate: payment.paidDate
        });
        totalAmount += (payment.amount || MONTHLY_FEE);
        paymentsCount++;
      }
    });
    
    // Sort by paid date (most recent first)
    usersWhoPaid.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    
    res.json({
      month: monthString,
      totalAmount,
      paymentsCount,
      users: usersWhoPaid
    });
  } catch (error) {
    console.error('Error fetching month details:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all collected payments for a year - shows breakdown by user
export const getCollectedPayments = async (req, res) => {
  try {
    const { year } = req.params;
    const requestedYear = parseInt(year);
    const users = await User.find({ role: 'user' }, '-password');
    
    const userPayments = [];
    let totalAmount = 0;
    let totalPayments = 0;
    
    users.forEach(user => {
      const paidPayments = (user.paymentStatus || []).filter(
        p => p.status === 'Paid' && p.month.includes(year)
      );
      
      if (paidPayments.length > 0) {
        const userTotalPaid = paidPayments.reduce(
          (sum, p) => sum + (p.amount || MONTHLY_FEE), 
          0
        );
        
        userPayments.push({
          name: user.name,
          houseNo: user.houseNo,
          email: user.email,
          totalPaid: userTotalPaid,
          monthsPaid: paidPayments.length,
          paidMonths: paidPayments.map(p => p.month).sort()
        });
        
        totalAmount += userTotalPaid;
        totalPayments += paidPayments.length;
      }
    });
    
    // Sort by total paid (highest first)
    userPayments.sort((a, b) => b.totalPaid - a.totalPaid);
    
    res.json({
      year: requestedYear,
      totalAmount,
      totalPayments,
      users: userPayments
    });
  } catch (error) {
    console.error('Error fetching collected payments:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// NEW: Get detailed dues overview for clean Dues section
export const getDuesOverview = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }, '-password');
    
    let totalPendingDues = 0;
    let totalCollected = 0;
    let usersWithPendingDues = [];
    
    users.forEach(user => {
      const duesData = calculateUserDuesFromRegistration(user);
      
      // Calculate total collected for this user
      const paidPayments = (user.paymentStatus || []).filter(p => p.status === 'Paid');
      const userTotalCollected = paidPayments.length * MONTHLY_FEE;
      totalCollected += userTotalCollected;
      
      // Add to pending dues
      totalPendingDues += duesData.totalDues;
      
      // If user has pending dues, add to list
      if (duesData.totalDues > 0) {
        usersWithPendingDues.push({
          _id: user._id,
          name: user.name,
          houseNo: user.houseNo,
          floor: user.floor,
          email: user.email,
          phoneNumber: user.phoneNumber,
          whatsappNumber: user.whatsappNumber,
          totalDues: duesData.totalDues,
          monthsUnpaid: duesData.monthsUnpaid,
          unpaidMonths: duesData.unpaidMonths,
          lastPaymentDate: paidPayments.length > 0 ? paidPayments[paidPayments.length - 1].paidDate : null,
          paymentTrackingStartMonth: user.paymentTrackingStartMonth
        });
      }
    });
    
    // Sort by highest dues first
    usersWithPendingDues.sort((a, b) => b.totalDues - a.totalDues);
    
    res.json({
      summary: {
        totalPendingDues,
        totalCollected,
        totalUsersWithDues: usersWithPendingDues.length,
        totalUsers: users.length,
        monthlyFee: MONTHLY_FEE
      },
      usersWithDues: usersWithPendingDues
    });
  } catch (error) {
    console.error('Error fetching dues overview:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};