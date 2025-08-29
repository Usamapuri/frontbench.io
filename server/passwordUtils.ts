import bcrypt from 'bcryptjs';

// Generate a fixed temporary password
export function generateTemporaryPassword(): string {
  return 'Password123';
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