// controllers/teamController.js - Updated with notifications and email confirmation
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Collection from '../models/Collection.js';
import { sendPaymentConfirmationEmail } from '../utils/emailService.js';

const MONTHLY_FEE = 3000;

// Helper function to get months array
const getMonths = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper function to get month index
const getMonthIndex = (monthName) => {
  return getMonths().indexOf(monthName);
};

// Helper function to generate months from registration date to current date
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

// Helper function to calculate user dues from registration date
const calculateUserDuesFromRegistration = (user) => {
  if (!user.paymentTrackingStartMonth) return { totalDues: 0, monthsUnpaid: 0, unpaidMonths: [] };
  
  const [startMonthName, startYearStr] = user.paymentTrackingStartMonth.split(' ');
  const startYear = parseInt(startYearStr);
  
  // Get current month and year
  const now = new Date();
  const currentMonthName = getMonths()[now.getMonth()];
  const currentYear = now.getFullYear();
  
  // Generate required months from registration to current
  const requiredMonths = getMonthsFromRegistration(startMonthName, startYear, currentMonthName, currentYear);
  
  // Filter existing payments to only include those from registration onwards
  const validPayments = (user.paymentStatus || []).filter(payment => {
    return requiredMonths.includes(payment.month);
  });
  
  // Find unpaid months
  const paidMonths = validPayments.filter(p => p.status === 'Paid').map(p => p.month);
  const unpaidMonths = requiredMonths.filter(month => !paidMonths.includes(month));
  
  return {
    totalDues: unpaidMonths.length * MONTHLY_FEE,
    monthsUnpaid: unpaidMonths.length,
    unpaidMonths
  };
};

// Helper function to update collections
const updateCollections = async (month, year, amount = MONTHLY_FEE) => {
  try {
    let collection = await Collection.findOne({ year });
    
    if (!collection) {
      // Create new year collection record
      const months = getMonths();
      collection = new Collection({
        year,
        totalAmount: 0,
        monthlyBreakdown: months.map(m => ({
          month: m,
          amount: 0,
          paymentsCount: 0
        }))
      });
    }

    // Update monthly breakdown
    const monthData = collection.monthlyBreakdown.find(m => m.month === month);
    if (monthData) {
      monthData.amount += amount;
      monthData.paymentsCount += 1;
    }

    // Update total
    collection.totalAmount += amount;
    collection.lastUpdated = new Date();

    await collection.save();
    return collection;
  } catch (error) {
    console.error('Error updating collections:', error);
    throw error;
  }
};

// Get all users with dues information for team (EXCLUDES admin users)
export const getTeamUsers = async (req, res) => {
  try {
    // Only get regular users, exclude admins
    const users = await User.find({ role: 'user' }, '-password');
    
    // Calculate dues for each user based on their registration date
    const usersWithDues = users.map(user => {
      const duesData = calculateUserDuesFromRegistration(user);

      return {
        ...user.toObject(),
        totalDues: duesData.totalDues,
        monthsUnpaid: duesData.monthsUnpaid,
        unpaidMonths: duesData.unpaidMonths,
        isOverdue: duesData.monthsUnpaid > 0,
        monthlyFee: MONTHLY_FEE,
        paymentTrackingStartMonth: user.paymentTrackingStartMonth,
        registrationDate: user.registrationDate
      };
    });

    // Sort by overdue first, then by months unpaid (descending)
    usersWithDues.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.monthsUnpaid - a.monthsUnpaid;
    });

    res.json(usersWithDues);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Mark bill as paid, create notification, and send email
export const markBillAsPaid = async (req, res) => {
  const { userId, month } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent marking payments for admin users
    if (user.role === 'admin') {
      return res.status(403).json({ msg: 'Cannot mark payments for admin users' });
    }

    // Check if the month is valid for this user (from registration onwards)
    if (user.paymentTrackingStartMonth) {
      const [startMonthName, startYearStr] = user.paymentTrackingStartMonth.split(' ');
      const startYear = parseInt(startYearStr);
      const startMonthIndex = getMonthIndex(startMonthName);
      
      const [paymentMonthName, paymentYearStr] = month.split(' ');
      const paymentYear = parseInt(paymentYearStr);
      const paymentMonthIndex = getMonthIndex(paymentMonthName);
      
      // Check if payment month is before user's registration
      const isBeforeRegistration = (paymentYear < startYear) || 
                                  (paymentYear === startYear && paymentMonthIndex < startMonthIndex);
      
      if (isBeforeRegistration) {
        return res.status(400).json({ 
          msg: `Cannot mark payment for ${month} as user registered in ${user.paymentTrackingStartMonth}` 
        });
      }
    }

    const paidDate = new Date();

    // Update payment status
    let paymentStatus = user.paymentStatus || [];
    const existingPayment = paymentStatus.find(p => p.month === month);

    if (existingPayment) {
      if (existingPayment.status === 'Paid') {
        return res.status(400).json({ msg: 'Payment already marked as paid' });
      }
      existingPayment.status = 'Paid';
      existingPayment.paidDate = paidDate;
      existingPayment.amount = MONTHLY_FEE;
    } else {
      paymentStatus.push({
        month,
        status: 'Paid',
        paidDate,
        amount: MONTHLY_FEE
      });
    }

    user.paymentStatus = paymentStatus;
    await user.save();

    // Update collections
    const [monthName, year] = month.split(' ');
    await updateCollections(monthName, parseInt(year), MONTHLY_FEE);

    // Create notification for the user
    try {
      const notification = new Notification({
        userId: user._id,
        type: 'payment',
        title: 'Payment Received',
        message: `You have successfully paid your maintenance charges for the month of ${month} on ${paidDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${paidDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`,
        month,
        amount: MONTHLY_FEE,
        paidDate,
        isRead: false
      });

      await notification.save();
      console.log(`Notification created for user ${user.name} (${user.email})`);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the payment if notification creation fails
    }

    // Send payment confirmation email
    try {
      const emailResult = await sendPaymentConfirmationEmail(
        user.email,
        user.name,
        month,
        MONTHLY_FEE,
        paidDate
      );

      if (emailResult.success) {
        console.log(`Payment confirmation email sent to ${user.email}`);
      } else {
        console.error(`Failed to send payment confirmation email to ${user.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the payment if email sending fails
    }

    res.status(200).json({ 
      msg: 'Payment marked as paid, notification created, and confirmation email sent',
      payment: {
        month,
        amount: MONTHLY_FEE,
        paidDate
      }
    });
  } catch (error) {
    console.error('Error marking payment:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};