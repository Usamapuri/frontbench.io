import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertStudentSchema, 
  insertInvoiceSchema, 
  insertPaymentSchema,
  insertAttendanceSchema,
  insertAssessmentSchema,
  insertGradeSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Students routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Subjects routes
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const classLevel = req.query.classLevel as string;
      const subjects = classLevel 
        ? await storage.getSubjectsByClassLevel(classLevel)
        : await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Teacher routes
  app.get("/api/teacher/classes/today", isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const classes = await storage.getTodayClasses(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({ message: "Failed to fetch today's classes" });
    }
  });

  app.get("/api/teacher/earnings", isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const earnings = await storage.getTeacherEarnings(teacherId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching teacher earnings:", error);
      res.status(500).json({ message: "Failed to fetch teacher earnings" });
    }
  });

  // Classes routes
  app.get("/api/classes/:id/students", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudentsByClass(req.params.id);
      res.json(students);
    } catch (error) {
      console.error("Error fetching class students:", error);
      res.status(500).json({ message: "Failed to fetch class students" });
    }
  });

  // Attendance routes
  app.post("/api/attendance", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse({
        ...req.body,
        markedBy: req.user.claims.sub,
      });
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(400).json({ message: "Failed to create attendance record" });
    }
  });

  app.get("/api/attendance/class/:classId/:date", isAuthenticated, async (req, res) => {
    try {
      const { classId, date } = req.params;
      const attendance = await storage.getAttendanceByClass(classId, date);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching class attendance:", error);
      res.status(500).json({ message: "Failed to fetch class attendance" });
    }
  });

  app.get("/api/attendance/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;
      const attendance = await storage.getStudentAttendance(
        studentId, 
        startDate as string, 
        endDate as string
      );
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch student attendance" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const invoices = await storage.getInvoices(limit);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const payments = await storage.getPayments(limit);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        receivedBy: req.user.claims.sub,
      });
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  // Grades routes
  app.post("/api/assessments", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse({
        ...req.body,
        teacherId: req.user.claims.sub,
      });
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment" });
    }
  });

  app.post("/api/grades", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertGradeSchema.parse({
        ...req.body,
        enteredBy: req.user.claims.sub,
      });
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(400).json({ message: "Failed to create grade" });
    }
  });

  app.get("/api/grades/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const grades = await storage.getStudentGrades(req.params.studentId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ message: "Failed to fetch student grades" });
    }
  });

  // Cash draw requests routes
  app.get("/api/cash-draw-requests", isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getCashDrawRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching cash draw requests:", error);
      res.status(500).json({ message: "Failed to fetch cash draw requests" });
    }
  });

  app.post("/api/cash-draw-requests", isAuthenticated, async (req: any, res) => {
    try {
      const requestData = {
        ...req.body,
        teacherId: req.user.claims.sub,
      };
      const request = await storage.createCashDrawRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating cash draw request:", error);
      res.status(400).json({ message: "Failed to create cash draw request" });
    }
  });

  app.patch("/api/cash-draw-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = {
        ...req.body,
        reviewedBy: req.user.claims.sub,
        reviewedAt: new Date(),
      };
      const request = await storage.updateCashDrawRequest(req.params.id, updates);
      res.json(request);
    } catch (error) {
      console.error("Error updating cash draw request:", error);
      res.status(400).json({ message: "Failed to update cash draw request" });
    }
  });

  // Daily close routes
  app.get("/api/daily-close/:date", isAuthenticated, async (req, res) => {
    try {
      const dailyCloseRecord = await storage.getDailyClose(req.params.date);
      res.json(dailyCloseRecord || null);
    } catch (error) {
      console.error("Error fetching daily close:", error);
      res.status(500).json({ message: "Failed to fetch daily close" });
    }
  });

  app.post("/api/daily-close", isAuthenticated, async (req: any, res) => {
    try {
      const dailyCloseData = {
        ...req.body,
        closedBy: req.user.claims.sub,
      };
      const dailyCloseRecord = await storage.createDailyClose(dailyCloseData);
      res.status(201).json(dailyCloseRecord);
    } catch (error) {
      console.error("Error creating daily close:", error);
      res.status(400).json({ message: "Failed to create daily close" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const expenses = await storage.getExpenses(limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const expenseData = {
        ...req.body,
        enteredBy: req.user.claims.sub,
      };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
