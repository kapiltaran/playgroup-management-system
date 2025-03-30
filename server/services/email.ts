import nodemailer from 'nodemailer';
import { User } from '../../shared/schema';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// We'll need to set up an email service with real credentials
// For now, we're using a test account that will log emails to console
// In production, replace with actual mail service (e.g., SendGrid, Mailgun, SMTP)
let transporter: nodemailer.Transporter;

// Initialize the email transporter
export async function initEmailService() {
  // Use environment variables in production
  // process.env.EMAIL_HOST, process.env.EMAIL_USER, etc.
  
  // For testing/development, we'll use a test account
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log('Email service initialized');
  console.log('Test email account credentials:');
  console.log(`Username: ${testAccount.user}`);
  console.log(`Password: ${testAccount.pass}`);
  console.log('View test emails at: https://ethereal.email/');
}

// Send an email
export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!transporter) {
    await initEmailService();
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"Playgroup Management" <no-reply@playgroup.com>',
      to,
      subject,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Send a verification email
export async function sendVerificationEmail(user: User, verificationUrl: string) {
  const html = `
    <h1>Welcome to Playgroup Management System</h1>
    <p>Hello ${user.fullName},</p>
    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
    <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
    <p>${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Thank you,<br>Playgroup Management Team</p>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Please Verify Your Email',
    html,
  });
}

// Send a password reset email
export async function sendPasswordResetEmail(user: User, resetUrl: string) {
  const html = `
    <h1>Playgroup Management System - Password Reset</h1>
    <p>Hello ${user.fullName},</p>
    <p>We received a request to reset your password. Please click the link below to set a new password:</p>
    <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
    <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
    <p>Thank you,<br>Playgroup Management Team</p>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html,
  });
}

// Send a welcome email with temporary password
export async function sendWelcomeEmail(user: User, tempPassword: string, loginUrl: string) {
  const html = `
    <h1>Welcome to Playgroup Management System</h1>
    <p>Hello ${user.fullName},</p>
    <p>An account has been created for you as a parent in our Playgroup Management System.</p>
    <p>Your login details are:</p>
    <ul>
      <li><strong>Username:</strong> ${user.username}</li>
      <li><strong>Email:</strong> ${user.email}</li>
      <li><strong>Temporary Password:</strong> ${tempPassword}</li>
    </ul>
    <p>Please log in using the link below and change your password immediately:</p>
    <p><a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Login Now</a></p>
    <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
    <p>${loginUrl}</p>
    <p>Thank you,<br>Playgroup Management Team</p>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Playgroup Management System',
    html,
  });
}

// Send MFA code
export async function sendMfaCode(user: User, code: string) {
  const html = `
    <h1>Your Verification Code</h1>
    <p>Hello ${user.fullName},</p>
    <p>Here is your verification code to complete the login process:</p>
    <h2 style="font-size: 32px; letter-spacing: 5px; background-color: #f5f5f5; padding: 10px; text-align: center;">${code}</h2>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this code, please ignore this email and secure your account.</p>
    <p>Thank you,<br>Playgroup Management Team</p>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Your Login Verification Code',
    html,
  });
}