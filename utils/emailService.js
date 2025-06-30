const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
    try {
        const subject = purpose === 'verification' ? 'Phoenix Headphones - Email Verification' : 'Phoenix Headphones - Password Reset';
        const text = purpose === 'verification'
            ? `Your verification OTP is: ${otp}. This OTP will expire in 1 minute.`
            : `Your password reset OTP is: ${otp}. This OTP will expire in 1 minute.`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin: 0;">Phoenix Headphones</h1>
                    <p style="color: #666; margin: 5px 0;">Premium Audio Experience</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0;">${purpose === 'verification' ? 'Email Verification' : 'Password Reset'}</h2>
                    <p style="color: #555; line-height: 1.6;">
                        ${purpose === 'verification' 
                            ? 'Thank you for signing up with Phoenix Headphones! Please use the following OTP to verify your email address:'
                            : 'You have requested to reset your password. Please use the following OTP to proceed:'
                        }
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                            ${otp}
                        </div>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; text-align: center;">
                        This OTP will expire in 1 minute for security reasons.
                    </p>
                </div>
                
                <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>&copy; 2024 Phoenix Headphones. All rights reserved.</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: subject,
            text: text,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail
};
