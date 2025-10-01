// controllers/userController.js - Updated to match new model structure
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('-password -houseHelp.policeCharacterCertificate.fileData -driver.policeCharacterCertificate.fileData');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return complete user profile with new structure
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      whatsappNumber: user.whatsappNumber,
      houseNo: user.houseNo,
      floor: user.floor,
      nic: user.nic,
      status: user.status,
      role: user.role,
      tenantInfo: user.tenantInfo,
      solorInstalled: user.solorInstalled,
      carRegistrationNo: user.carRegistrationNo,
      motorcycleRegNo: user.motorcycleRegNo,
      SSGC_ID: user.SSGC_ID,
      KE_ID: user.KE_ID,
      KWSB_ID: user.KWSB_ID,
      houseHelp: user.houseHelp ? user.houseHelp.map(help => ({
        name: help.name,
        nic: help.nic,
        phoneNumber: help.phoneNumber,
        hasCriminalRecord: help.hasCriminalRecord,
        policeCharacterCertificate: help.policeCharacterCertificate ? {
          filename: help.policeCharacterCertificate.filename,
          originalName: help.policeCharacterCertificate.originalName,
          mimeType: help.policeCharacterCertificate.mimeType,
          size: help.policeCharacterCertificate.size,
          uploadDate: help.policeCharacterCertificate.uploadDate
        } : null
      })) : [],
      driver: user.driver ? {
        name: user.driver.name,
        nic: user.driver.nic,
        licenseNo: user.driver.licenseNo,
        phoneNumber: user.driver.phoneNumber,
        hasCriminalRecord: user.driver.hasCriminalRecord,
        policeCharacterCertificate: user.driver.policeCharacterCertificate ? {
          filename: user.driver.policeCharacterCertificate.filename,
          originalName: user.driver.policeCharacterCertificate.originalName,
          mimeType: user.driver.policeCharacterCertificate.mimeType,
          size: user.driver.policeCharacterCertificate.size,
          uploadDate: user.driver.policeCharacterCertificate.uploadDate
        } : null
      } : null,
      paymentStatus: user.paymentStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ msg: 'Server error while fetching profile' });
  }
};

// Update User Info
export const updateUserInfo = async (req, res) => {
  const { userId } = req.user;
  const updateData = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // List of fields that can be updated
    const allowedFields = [
      'name',
      'phoneNumber',
      'whatsappNumber',
      'houseNo',
      'floor',
      'nic',
      'status',
      'tenantInfo',
      'solorInstalled',
      'carRegistrationNo',
      'motorcycleRegNo',
      'SSGC_ID',
      'KE_ID',
      'KWSB_ID',
      'houseHelp',
      'driver'
    ];

    // Update only allowed fields that are provided
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        user[field] = updateData[field];
      }
    });

    // Special handling for nested objects
    if (updateData.tenantInfo) {
      user.tenantInfo = {
        tenant1: updateData.tenantInfo.tenant1 || user.tenantInfo?.tenant1 || '-',
        tenant2: updateData.tenantInfo.tenant2 || user.tenantInfo?.tenant2 || '-',
        tenant3: updateData.tenantInfo.tenant3 || user.tenantInfo?.tenant3 || '-',
        tenant4: updateData.tenantInfo.tenant4 || user.tenantInfo?.tenant4 || '-',
      };
    }

    // Handle house help array with individual criminal records
    if (updateData.houseHelp && Array.isArray(updateData.houseHelp)) {
      user.houseHelp = await Promise.all(updateData.houseHelp.map(async (help, index) => {
        const helpData = {
          name: help.name || '',
          nic: help.nic || '',
          phoneNumber: help.phoneNumber || '',
          hasCriminalRecord: Boolean(help.hasCriminalRecord)
        };

        // Preserve existing certificate if not updating
        if (user.houseHelp[index] && user.houseHelp[index].policeCharacterCertificate) {
          helpData.policeCharacterCertificate = user.houseHelp[index].policeCharacterCertificate;
        }

        // Handle new certificate upload
        if (helpData.hasCriminalRecord && req.files) {
          const certificateFieldName = `houseHelpCertificate_${index}`;
          const file = req.files[certificateFieldName];
          
          if (file) {
            // Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
              throw new Error(`Police Character Certificate for House Help ${index + 1} must be less than 5MB`);
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(`Police Character Certificate for House Help ${index + 1} must be a PDF, JPG, or PNG file`);
            }

            helpData.policeCharacterCertificate = {
              filename: `house_help_${index}_cert_${Date.now()}_${file.name}`,
              originalName: file.name,
              mimeType: file.mimetype,
              size: file.size,
              uploadDate: new Date(),
              fileData: file.data
            };
          }
        } else if (!helpData.hasCriminalRecord) {
          // Remove certificate if criminal record is set to false
          helpData.policeCharacterCertificate = undefined;
        }

        return helpData;
      }));
    }

    // Handle driver object with individual criminal record
    if (updateData.driver) {
      if (updateData.driver.name || updateData.driver.nic || updateData.driver.licenseNo || updateData.driver.phoneNumber) {
        const driverData = {
          name: updateData.driver.name || '',
          nic: updateData.driver.nic || '',
          licenseNo: updateData.driver.licenseNo || '',
          phoneNumber: updateData.driver.phoneNumber || '',
          hasCriminalRecord: Boolean(updateData.driver.hasCriminalRecord)
        };

        // Preserve existing certificate if not updating
        if (user.driver && user.driver.policeCharacterCertificate) {
          driverData.policeCharacterCertificate = user.driver.policeCharacterCertificate;
        }

        // Handle new certificate upload
        if (driverData.hasCriminalRecord && req.files && req.files.driverCertificate) {
          const file = req.files.driverCertificate;
          
          // Validate file size (5MB limit)
          const maxSize = 5 * 1024 * 1024;
          if (file.size > maxSize) {
            return res.status(400).json({ msg: 'Driver Police Character Certificate must be less than 5MB' });
          }

          // Validate file type
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ msg: 'Driver Police Character Certificate must be a PDF, JPG, or PNG file' });
          }

          driverData.policeCharacterCertificate = {
            filename: `driver_cert_${Date.now()}_${file.name}`,
            originalName: file.name,
            mimeType: file.mimetype,
            size: file.size,
            uploadDate: new Date(),
            fileData: file.data
          };
        } else if (!driverData.hasCriminalRecord) {
          // Remove certificate if criminal record is set to false
          driverData.policeCharacterCertificate = undefined;
        }

        user.driver = driverData;
      } else {
        user.driver = undefined;
      }
    }

    await user.save();

    res.status(200).json({ 
      msg: 'User information updated successfully', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        whatsappNumber: user.whatsappNumber,
        houseNo: user.houseNo,
        floor: user.floor,
        nic: user.nic,
        status: user.status,
        role: user.role,
        tenantInfo: user.tenantInfo,
        solorInstalled: user.solorInstalled,
        carRegistrationNo: user.carRegistrationNo,
        motorcycleRegNo: user.motorcycleRegNo,
        SSGC_ID: user.SSGC_ID,
        KE_ID: user.KE_ID,
        KWSB_ID: user.KWSB_ID,
        houseHelp: user.houseHelp,
        driver: user.driver,
        paymentStatus: user.paymentStatus,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ msg: error.message || 'Server error while updating profile' });
  }
};

// Get User Payment Status
export const getUserPaymentStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('name houseNo paymentStatus');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Initialize payment status for current year if empty
    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let paymentStatus = user.paymentStatus || [];

    // Ensure all months for current year exist
    months.forEach(month => {
      const monthYear = `${month} ${currentYear}`;
      if (!paymentStatus.find(p => p.month === monthYear)) {
        paymentStatus.push({
          month: monthYear,
          status: 'Not Paid',
          paidDate: null
        });
      }
    });

    // Update user if new months were added
    if (paymentStatus.length > (user.paymentStatus?.length || 0)) {
      user.paymentStatus = paymentStatus;
      await user.save();
    }

    res.status(200).json({
      user: {
        name: user.name,
        houseNo: user.houseNo
      },
      paymentStatus: paymentStatus
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ msg: 'Server error while fetching payment status' });
  }
};

// Update User Password
export const updateUserPassword = async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ msg: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ msg: 'Server error while updating password' });
  }
};