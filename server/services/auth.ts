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

// Hash a password using a simple format for development/testing
export function hashPassword(password: string): string {
  // For development/testing, we're using a simple format
  return `hashed_${password}`;
}

// Verify a password against a hash
export function verifyPassword(password: string, hashedPassword: string): boolean {
  // Check if it's a simple hash format (for development/testing)
  if (hashedPassword.startsWith('hashed_')) {
    return `hashed_${password}` === hashedPassword;
  }
  
  // Otherwise, it's a crypto-based hash from before
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
  console.log("🔄 CREATING USER FROM STUDENT - FUNCTION ENTRY");
  console.log("Input parameters:", { studentId, fullName, email, baseUrl });
  
  // Generate username from email (before the @ sign)
  const username = email.split('@')[0];
  console.log("✅ Generated username:", username);
  
  // Use fixed password "pass123" for testing purposes
  const tempPassword = "pass123";
  const passwordHash = hashPassword(tempPassword);
  console.log("✅ Generated password hash successfully");
  
  // Generate verification token
  const { token, expires } = generateVerificationToken();
  console.log("✅ Generated verification token successfully");
  
  console.log("✅ User details prepared and ready for storage:", { 
    username, 
    email, 
    fullName, 
    passwordHash: "[REDACTED]", 
    role: 'parent',
    active: true,
    studentId,
    emailVerified: false,
    tokenLength: token ? token.length : 0
  });
  
  try {
    console.log("➡️ Attempting to create user in storage...");
    
    // Create user record with all required fields
    const userInput = {
      username,
      email,
      fullName,
      passwordHash,
      role: 'parent' as const, // Ensure type safety
      active: true,
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpires: expires,
      studentId: studentId // Ensure this is passed correctly
    };
    
    console.log("User data being passed to storage:", {
      ...userInput,
      passwordHash: "[REDACTED]",
      verificationToken: userInput.verificationToken ? "PRESENT" : "MISSING",
    });
    
    const user = await storage.createUser(userInput);
    
    console.log("✅ STORAGE SUCCESS: User created successfully:", { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      studentId: user.studentId
    });
    
    return { user, password: tempPassword };
  } catch (error) {
    console.error("❌ CRITICAL ERROR in createUserFromStudent:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to create user account: ${error instanceof Error ? error.message : String(error)}`);
  }
}