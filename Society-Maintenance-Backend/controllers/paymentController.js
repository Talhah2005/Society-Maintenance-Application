// controllers/paymentController.js - Updated with registration-based tracking
import User from '../models/User.js';
import Collection from '../models/Collection.js';

const MONTHLY_FEE = 3000; // Fixed monthly fee in PKR

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

// Helper function to initialize user payment status from registration month
const initializeUserPayments = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  // Parse the payment tracking start month
  const startMonth = user.paymentTrackingStartMonth;
  if (!startMonth) {
    // If no start month is set, use current month (shouldn't happen with new schema)
    const months = getMonths();
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();
    user.paymentTrackingStartMonth = `${currentMonth} ${currentYear}`;
    await user.save();
  }

  const [startMonthName, startYearStr] = user.paymentTrackingStartMonth.split(' ');
  const startYear = parseInt(startYearStr);
  
  // Get current month and year
  const now = new Date();
  const currentMonthName = getMonths()[now.getMonth()];
  const currentYear = now.getFullYear();
  
  // Generate all months from registration to current month
  const requiredMonths = getMonthsFromRegistration(startMonthName, startYear, currentMonthName, currentYear);
  
  // Get existing payment status
  const existingPayments = user.paymentStatus || [];
  const existingMonths = existingPayments.map(p => p.month);
  
  // Add missing months
  const newPayments = [];
  requiredMonths.forEach(month => {
    if (!existingMonths.includes(month)) {
      newPayments.push({
        month,
        status: 'Not Paid',
        paidDate: null,
        amount: MONTHLY_FEE
      });
    }
  });
  
  if (newPayments.length > 0) {
    user.paymentStatus = [...existingPayments, ...newPayments];
    await user.save();
  }
  
  return user;
};

// Calculate user's total dues
export const calculateUserDues = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await initializeUserPayments(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const unpaidPayments = user.paymentStatus.filter(p => p.status === 'Not Paid');
    const totalDues = unpaidPayments.length * MONTHLY_FEE;
    const monthsUnpaid = unpaidPayments.length;

    res.json({
      totalDues,
      monthsUnpaid,
      unpaidMonths: unpaidPayments.map(p => p.month),
      monthlyFee: MONTHLY_FEE,
      paymentTrackingStartMonth: user.paymentTrackingStartMonth
    });
  } catch (error) {
    console.error('Error calculating dues:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get user payment history with dues (only from registration date)
export const getUserPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await initializeUserPayments(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Filter payments to only include those from registration date onwards
    const validPayments = user.paymentStatus.filter(payment => {
      const [startMonthName, startYearStr] = user.paymentTrackingStartMonth.split(' ');
      const startYear = parseInt(startYearStr);
      const startMonthIndex = getMonthIndex(startMonthName);
      
      const [paymentMonthName, paymentYearStr] = payment.month.split(' ');
      const paymentYear = parseInt(paymentYearStr);
      const paymentMonthIndex = getMonthIndex(paymentMonthName);
      
      // Include payment if it's from registration month onwards
      return (paymentYear > startYear) || 
             (paymentYear === startYear && paymentMonthIndex >= startMonthIndex);
    });

    const unpaidCount = validPayments.filter(p => p.status === 'Not Paid').length;
    const paidCount = validPayments.filter(p => p.status === 'Paid').length;
    const totalDues = unpaidCount * MONTHLY_FEE;

    // Sort payments by chronological order
    const sortedPayments = validPayments.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      const yearDiff = parseInt(aYear) - parseInt(bYear);
      if (yearDiff !== 0) return yearDiff;
      return getMonthIndex(aMonth) - getMonthIndex(bMonth);
    });

    res.json({
      user: {
        name: user.name,
        houseNo: user.houseNo,
        email: user.email
      },
      monthlyFee: MONTHLY_FEE,
      totalDues,
      monthsUnpaid: unpaidCount,
      monthsPaid: paidCount,
      paymentTrackingStartMonth: user.paymentTrackingStartMonth,
      registrationDate: user.registrationDate,
      paymentHistory: sortedPayments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};