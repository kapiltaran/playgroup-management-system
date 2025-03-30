import crypto from 'crypto';
import { User } from '../../shared/schema';
import { IStorage } from '../storage';

// Generate a random password of specified length
export function generateRandomPassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

// Hash a password using crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify a password against a hash
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Generate a verification token
export function generateVerificationToken(): { token: string, expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  // Token expires in 24 hours
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return { token, expires };
}

// Generate a password reset token
export function generatePasswordResetToken(): { token: string, expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  // Token expires in 1 hour
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  
  return { token, expires };
}

// Generate a MFA code
export function generateMfaCode(): { code: string, expires: Date } {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Code expires in 10 minutes
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  
  return { code, expires };
}

// Verify a token (either verification or password reset)
export function verifyToken(token: string, storedToken: string | null, expiresAt: Date | null): boolean {
  if (!storedToken || !expiresAt) return false;
  if (new Date() > expiresAt) return false;
  
  return token === storedToken;
}

// Create user account when a student is added
export async function createUserFromStudent(
  storage: IStorage, 
  studentId: number, 
  fullName: string, 
  email: string,
  baseUrl: string
): Promise<{ user: User, password: string }> {
  console.log("Creating user from student:", { studentId, fullName, email });
  
  // Generate username from email (before the @ sign)
  const username = email.split('@')[0];
  
  // Use fixed password "pass123" for testing purposes
  const tempPassword = "pass123";
  const passwordHash = hashPassword(tempPassword);
  
  // Generate verification token
  const { token, expires } = generateVerificationToken();
  
  console.log("User details prepared:", { 
    username, 
    email, 
    fullName, 
    passwordHash: "[REDACTED]", 
    role: 'parent',
    active: true,
    studentId 
  });
  
  try {
    // Create user record
    const user = await storage.createUser({
      username,
      email,
      fullName,
      passwordHash,
      role: 'parent',
      active: true,
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpires: expires,
      studentId
    });
    
    console.log("User created successfully:", { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    });
    
    return { user, password: tempPassword };
  } catch (error) {
    console.error("Error creating user in storage:", error);
    throw error;
  }
}