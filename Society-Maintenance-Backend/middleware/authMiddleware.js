// middleware/authMiddleware.js - FIXED
import jwt from 'jsonwebtoken';

const authenticateJWT = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Admin only middleware
export const adminOnly = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    if (role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Team only middleware
export const teamOnly = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    if (role !== 'team' && role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Team member only.' });
    }
    
    next();
  } catch (error) {
    console.error('Team verification error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export default authenticateJWT;