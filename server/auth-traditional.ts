import { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";
import { comparePassword } from "./passwordUtils";
import connectPg from "connect-pg-simple";

// Session configuration for traditional auth
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Don't create table, use existing one
    ttl: sessionTtl,
    tableName: "sessions", // Use existing sessions table
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'primax-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Authentication middleware
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Set up traditional authentication routes
export function setupTraditionalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated. Please contact administrator." });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Store user in session (exclude password)
      const userSession = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        isTeacher: user.isTeacher,
      };

      req.session.user = userSession;

      res.json(userSession);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req, res) => {
    if (req.session?.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Forgot password endpoint (placeholder for future email functionality)
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive password reset instructions." });
      }

      // TODO: Implement email sending functionality
      // For now, just log the reset request
      console.log(`Password reset requested for user: ${email} (ID: ${user.id})`);
      
      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send email with reset link
      // 4. Implement reset password endpoint

      res.json({ message: "If an account exists with this email, you will receive password reset instructions." });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}