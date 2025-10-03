// config/api.js - Updated with notification endpoints
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.9:5001/api',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP_RESET: '/auth/verify-otp-reset',
    
    // User endpoints
    USER_PROFILE: '/user/profile',
    UPDATE_USER: '/user/update',
    USER_PAYMENT_STATUS: '/user/payment-status',
    UPDATE_PASSWORD: '/user/update-password',
    
    // Payment endpoints
    PAYMENT_DUES: '/payments/dues',
    PAYMENT_HISTORY: '/payments/history',
    
    // Notification endpoints
    NOTIFICATIONS: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE_NOTIFICATION: '/notifications',
    CLEAR_READ: '/notifications/clear/read',
    
    // Admin endpoints
    ADMIN_USERS: '/admin/users',
    ADMIN_TEAM_MEMBERS: '/admin/team-members',
    ADMIN_ADD_TEAM: '/admin/add-team',
    ADMIN_DELETE_USER: '/admin/delete-user',
    ADMIN_DELETE_TEAM: '/admin/delete-team',
    ADMIN_UPDATE_USER: '/admin/update-user',
    ADMIN_UPDATE_TEAM: '/admin/update-team',
    ADMIN_DASHBOARD_STATS: '/admin/dashboard-stats',
    ADMIN_YEARLY_REPORT: '/admin/yearly-report',
    ADMIN_AVAILABLE_YEARS: '/admin/available-years',
    ADMIN_USERS_WITH_DUES: '/admin/users-with-dues',
    ADMIN_DUES_OVERVIEW: '/admin/dues-overview',
    ADMIN_MONTH_DETAILS: '/admin/month-details',
    ADMIN_COLLECTED_PAYMENTS: '/admin/collected-payments',
    
    // Team endpoints
    TEAM_USERS: '/team/users',
    TEAM_MARK_PAID: '/team/mark-paid'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API calls with common headers
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
    module => module.default
  );
  const token = await AsyncStorage.getItem('authToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
    },
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  return fetch(url, finalOptions);
};