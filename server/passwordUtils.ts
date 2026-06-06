import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Generate a random, human-friendly temporary password (shown once to the admin,
// must be changed on first login). NOT fixed — predictable temp passwords are a security risk.
export function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  const bytes = randomBytes(12);
  // Guarantee at least one of each class for password-policy friendliness
  const pick = (set: string, b: number) => set[b % set.length];
  const chars = [
    pick(upper, bytes[0]),
    pick(lower, bytes[1]),
    pick(digits, bytes[2]),
    ...Array.from(bytes.slice(3), (b) => pick(all, b)),
  ];
  return chars.join('');
}

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare a password with a hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate user credentials with temporary password
export async function generateUserCredentials() {
  const tempPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(tempPassword);
  
  return {
    temporaryPassword: tempPassword, // Store plaintext for display to admin
    password: hashedPassword, // Store hashed version in database
    mustChangePassword: true
  };
}