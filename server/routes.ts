import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { billingService } from "./billing";
import { isAuthenticated } from "./replitAuth";
import { 
  insertStudentSchema, 
  insertInvoiceSchema, 
  insertPaymentSchema,
  insertAttendanceSchema,
  insertAssessmentSchema,
  insertGradeSchema,
  insertAnnouncementSchema,
  insertClassScheduleSchema,
  insertScheduleChangeSchema,
  students,
  subjects,
  classes,
  enrollments,
  invoices,
  payments,
  paymentAllocations,
  invoiceAdjustments,
  attendance,
  users,
  expenses,
  assessments,
  grades,
  cashDrawRequests,
  announcements,
  announcementRecipients,
  addOns,
  invoiceItems,
  classSchedules,
  scheduleChanges,
  studentNotifications
} from "@shared/schema";
import { db } from "./db";
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Enhanced demo authentication with role-based access control
  app.use((req: any, res, next) => {
    // Parse role from URL query parameter for demo purposes
    const urlRole = req.query.role || 'finance';
    
    // Demo user configurations for different role types
    const demoUsers = {
      // Regular teacher - only sees teacher dashboard
      'teacher': {
        id: 'demo-teacher-1',
        role: 'teacher',
        isSuperAdmin: false,
        isTeacher: true,
        teacherSubjects: ['99c0039b-c3cb-4182-b311-5d69a755d548', '747f8a50-8cb0-4090-aaf0-1a6dda90103b'],
        firstName: 'Ahmed',
        lastName: 'Khan',
        email: 'teacher1@primax.edu'
      },
      // Super admin who is also a teacher - sees everything
      'super-admin-teacher': {
        id: 'demo-super-admin-teacher',
        role: 'teacher', // Base role is teacher
        isSuperAdmin: true,
        isTeacher: true,
        teacherSubjects: ['99c0039b-c3cb-4182-b311-5d69a755d548', '747f8a50-8cb0-4090-aaf0-1a6dda90103b'],
        firstName: 'Sarah',
        lastName: 'Ahmed',
        email: 'sarah.admin@primax.edu'
      },
      // Super admin management (not teacher) - sees finance, management, parent
      'super-admin-management': {
        id: 'demo-super-admin-mgmt',
        role: 'management',
        isSuperAdmin: true,
        isTeacher: false,
        teacherSubjects: [],
        firstName: 'Hassan',
        lastName: 'Ali',
        email: 'hassan.admin@primax.edu'
      },
      // Regular finance user
      'finance': {
        id: 'demo-finance-user',
        role: 'finance',
        isSuperAdmin: false,
        isTeacher: false,
        teacherSubjects: [],
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@primax.school'
      }
    };

    // Select user based on role parameter
    const user = demoUsers[urlRole as keyof typeof demoUsers] || demoUsers['finance'];
    
    req.user = {
      ...user,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    req.isAuthenticated = () => true;
    next();
  });

  // Enhanced auth route with role-based access info
  app.get('/api/auth/user', async (req: any, res) => {
    const user = req.user;
    
    // Determine accessible dashboards based on role and permissions
    const accessibleDashboards = getUserAccessibleDashboards(user);
    
    res.json({
      ...user,
      accessibleDashboards
    });
  });

  // Helper function to determine accessible dashboards
  function getUserAccessibleDashboards(user: any): string[] {
    const dashboards = [];
    
    if (user.isSuperAdmin) {
      // Super admins get access to finance, management, and parent dashboards
      dashboards.push('finance', 'management', 'parent');
      
      // Super admin teachers also get teacher dashboard
      if (user.isTeacher) {
        dashboards.push('teacher');
      }
    } else {
      // Regular users only get their primary role dashboard
      dashboards.push(user.role);
    }
    
    return dashboards;
  }

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Students routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  // Get enrollments for a specific student  
  app.get("/api/enrollments/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error: any) {
      console.error("Error fetching student enrollments:", error);
      res.status(500).json({ 
        message: "Failed to fetch student enrollments", 
        error: error.message || error 
      });
    }
  });

  // Complete enrollment endpoint - creates student, enrollments, and invoice
  app.post("/api/enrollments", async (req, res) => {
    try {
      const { 
        studentData, 
        selectedSubjects, 
        discountPercentage = 0, 
        customDiscountAmount = 0,
        additionalFees = [] 
      } = req.body;

      console.log("Processing complete enrollment:", { studentData, selectedSubjects, discountPercentage, customDiscountAmount });

      // 1. Create the student
      const validatedStudentData = insertStudentSchema.parse(studentData);
      const student = await storage.createStudent(validatedStudentData);
      console.log("Student created:", student.id);

      // 2. Create enrollments for selected subjects
      const enrollments = [];
      let totalTuition = 0;
      let subjectNames = [];

      for (const subjectId of selectedSubjects) {
        const subject = await storage.getSubjectById(subjectId);
        if (subject) {
          // Create enrollment
          const enrollment = await storage.createEnrollment({
            studentId: student.id,
            subjectId: subjectId,
            enrolledAt: new Date(),
            isActive: true
          });
          enrollments.push(enrollment);
          
          totalTuition += parseFloat(subject.baseFee);
          subjectNames.push(subject.name);
          console.log(`Enrolled in ${subject.name} - Fee: Rs.${subject.baseFee}`);
        }
      }

      // 3. Calculate final amount with discounts
      // Use custom discount amount if provided, otherwise use percentage
      const discountAmount = customDiscountAmount > 0 
        ? customDiscountAmount 
        : (totalTuition * discountPercentage) / 100;
      const additionalFeesTotal = additionalFees.reduce((sum: number, fee: any) => sum + parseFloat(fee.amount || 0), 0);
      const finalTotal = totalTuition - discountAmount + additionalFeesTotal;

      // 4. Generate initial invoice
      if (finalTotal > 0) {
        const invoiceNumber = `INV-${Date.now()}`;
        const currentDate = new Date();
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(currentDate.getMonth() + 1);
        const dueDate = new Date(currentDate);
        dueDate.setDate(currentDate.getDate() + 7); // 7 days to pay

        const invoice = await storage.createInvoice({
          studentId: student.id,
          invoiceNumber,
          type: 'monthly',
          billingPeriodStart: currentDate.toISOString().split('T')[0],
          billingPeriodEnd: nextMonth.toISOString().split('T')[0],
          issueDate: currentDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          subtotal: totalTuition.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          total: finalTotal.toFixed(2),
          amountPaid: '0.00',
          balanceDue: finalTotal.toFixed(2),
          status: 'sent',
          notes: `Initial enrollment invoice for ${subjectNames.join(', ')}${discountAmount > 0 ? (customDiscountAmount > 0 ? ` (Rs.${customDiscountAmount} discount applied)` : ` (${discountPercentage}% discount applied)`) : ''}`,
          createdBy: 'system'
        });
        
        console.log(`Invoice ${invoiceNumber} created for Rs.${finalTotal}`);

        res.status(201).json({
          student,
          enrollments,
          invoice,
          summary: {
            totalSubjects: selectedSubjects.length,
            subtotal: totalTuition,
            discount: discountAmount,
            total: finalTotal
          }
        });
      } else {
        res.status(201).json({
          student,
          enrollments,
          summary: {
            totalSubjects: selectedSubjects.length,
            subtotal: totalTuition,
            discount: discountAmount,
            total: finalTotal
          }
        });
      }

    } catch (error: any) {
      console.error("Error processing enrollment:", error);
      res.status(400).json({ 
        message: "Failed to process enrollment", 
        error: error.message || error 
      });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
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

  // New financial endpoints
  app.get("/api/students/:id/financial", async (req, res) => {
    try {
      const financialSummary = await storage.getStudentFinancialSummary(req.params.id);
      res.json(financialSummary);
    } catch (error) {
      console.error("Error fetching student financial data:", error);
      res.status(500).json({ message: "Failed to fetch financial data" });
    }
  });

  app.get("/api/students/:id/attendance", async (req, res) => {
    try {
      const attendancePercentage = await storage.getStudentAttendancePercentage(req.params.id);
      res.json({ attendancePercentage });
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance data" });
    }
  });

  app.get("/api/students/:id/grade", async (req, res) => {
    try {
      const averageGrade = await storage.getStudentAverageGrade(req.params.id);
      res.json({ averageGrade });
    } catch (error) {
      console.error("Error fetching student grade:", error);
      res.status(500).json({ message: "Failed to fetch grade data" });
    }
  });

  // Subjects routes
  app.get("/api/subjects", async (req, res) => {
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

  // Add-ons routes
  app.get("/api/add-ons", async (req, res) => {
    try {
      const addOns = await storage.getAddOns();
      res.json(addOns);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  app.post("/api/add-ons", async (req, res) => {
    try {
      const addOn = await storage.createAddOn(req.body);
      res.status(201).json(addOn);
    } catch (error) {
      console.error("Error creating add-on:", error);
      res.status(400).json({ message: "Failed to create add-on" });
    }
  });

  // Teacher routes
  app.get("/api/teacher/classes/today", async (req: any, res) => {
    try {
      // Use actual teacher ID from session (fallback to demo for now)
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const classes = await storage.getTodayClasses(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({ message: "Failed to fetch today's classes" });
    }
  });

  app.get("/api/teacher/earnings", async (req: any, res) => {
    try {
      // Use actual teacher ID from session (fallback to demo for now)
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const earnings = await storage.getTeacherEarningsRestricted(teacherId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching teacher earnings:", error);
      res.status(500).json({ message: "Failed to fetch teacher earnings" });
    }
  });

  // Get teacher's assigned subjects only
  app.get("/api/teacher/subjects", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const subjects = await storage.getTeacherSubjects(teacherId);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      res.status(500).json({ message: "Failed to fetch teacher subjects" });
    }
  });

  // Get students enrolled in teacher's subjects only
  app.get("/api/teacher/students", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const students = await storage.getTeacherStudents(teacherId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher students:", error);
      res.status(500).json({ message: "Failed to fetch teacher students" });
    }
  });

  // Get assessments created by teacher only (maintaining data isolation)
  app.get("/api/teacher/assessments", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const assessments = await storage.getTeacherAssessments(teacherId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching teacher assessments:", error);
      res.status(500).json({ message: "Failed to fetch teacher assessments" });
    }
  });

  // Schedule Management Routes
  
  // Get teacher's schedules
  app.get("/api/teacher/schedules", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const schedules = await storage.getTeacherSchedules(teacherId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching teacher schedules:", error);
      res.status(500).json({ message: "Failed to fetch teacher schedules" });
    }
  });

  // Create new schedule
  app.post("/api/teacher/schedules", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      
      const scheduleData = insertClassScheduleSchema.parse({
        ...req.body,
        teacherId: teacherId, // Ensure teacher can only create schedules for themselves
      });
      
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Update schedule
  app.put("/api/teacher/schedules/:id", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const scheduleId = req.params.id;
      
      // Verify schedule belongs to teacher before updating
      const existingSchedules = await storage.getTeacherSchedules(teacherId);
      const scheduleExists = existingSchedules.find(s => s.id === scheduleId);
      
      if (!scheduleExists) {
        return res.status(403).json({ message: "You can only update your own schedules" });
      }
      
      const updates = insertClassScheduleSchema.partial().parse(req.body);
      const updatedSchedule = await storage.updateSchedule(scheduleId, updates);
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // Delete schedule
  app.delete("/api/teacher/schedules/:id", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const scheduleId = req.params.id;
      
      // Verify schedule belongs to teacher before deleting
      const existingSchedules = await storage.getTeacherSchedules(teacherId);
      const scheduleExists = existingSchedules.find(s => s.id === scheduleId);
      
      if (!scheduleExists) {
        return res.status(403).json({ message: "You can only delete your own schedules" });
      }
      
      await storage.deleteSchedule(scheduleId);
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Schedule Changes Routes
  
  // Get schedule changes for teacher
  app.get("/api/teacher/schedule-changes", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const changes = await storage.getScheduleChanges(teacherId, startDate, endDate);
      res.json(changes);
    } catch (error) {
      console.error("Error fetching schedule changes:", error);
      res.status(500).json({ message: "Failed to fetch schedule changes" });
    }
  });

  // Create schedule change (cancellation, reschedule, extra class)
  app.post("/api/teacher/schedule-changes", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      
      const changeData = insertScheduleChangeSchema.parse({
        ...req.body,
        teacherId: teacherId,
        createdBy: req.user?.id || teacherId,
      });
      
      const change = await storage.createScheduleChange(changeData);
      res.status(201).json(change);
    } catch (error) {
      console.error("Error creating schedule change:", error);
      res.status(500).json({ message: "Failed to create schedule change" });
    }
  });

  // Update schedule change
  app.put("/api/teacher/schedule-changes/:id", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const changeId = req.params.id;
      
      // Verify change belongs to teacher
      const existingChanges = await storage.getScheduleChanges(teacherId);
      const changeExists = existingChanges.find(c => c.id === changeId);
      
      if (!changeExists) {
        return res.status(403).json({ message: "You can only update your own schedule changes" });
      }
      
      const updates = insertScheduleChangeSchema.partial().parse(req.body);
      const updatedChange = await storage.updateScheduleChange(changeId, updates);
      res.json(updatedChange);
    } catch (error) {
      console.error("Error updating schedule change:", error);
      res.status(500).json({ message: "Failed to update schedule change" });
    }
  });

  // Delete schedule change
  app.delete("/api/teacher/schedule-changes/:id", async (req: any, res) => {
    try {
      const teacherId = req.user?.role === 'teacher' ? req.user.id : "demo-teacher-1";
      const changeId = req.params.id;
      
      // Verify change belongs to teacher
      const existingChanges = await storage.getScheduleChanges(teacherId);
      const changeExists = existingChanges.find(c => c.id === changeId);
      
      if (!changeExists) {
        return res.status(403).json({ message: "You can only delete your own schedule changes" });
      }
      
      await storage.deleteScheduleChange(changeId);
      res.json({ message: "Schedule change deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule change:", error);
      res.status(500).json({ message: "Failed to delete schedule change" });
    }
  });

  // Student Schedule Routes
  
  // Get student's schedule and schedule changes
  app.get("/api/student/:studentId/schedule", async (req: any, res) => {
    try {
      const studentId = req.params.studentId;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const schedule = await storage.getStudentSchedule(studentId, startDate, endDate);
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ message: "Failed to fetch student schedule" });
    }
  });

  // Get student's schedule notifications
  app.get("/api/student/:studentId/notifications", async (req: any, res) => {
    try {
      const studentId = req.params.studentId;
      const notifications = await storage.getStudentNotifications(studentId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching student notifications:", error);
      res.status(500).json({ message: "Failed to fetch student notifications" });
    }
  });

  // Mark notification as read
  app.put("/api/student/notifications/:id/read", async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Classes routes
  app.get("/api/classes/:id/students", async (req, res) => {
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
        markedBy: "demo-teacher-id", // For demo purposes
      });
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(400).json({ message: "Failed to create attendance record" });
    }
  });

  app.get("/api/attendance/class/:classId/:date", async (req, res) => {
    try {
      const { classId, date } = req.params;
      const attendance = await storage.getAttendanceByClass(classId, date);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching class attendance:", error);
      res.status(500).json({ message: "Failed to fetch class attendance" });
    }
  });

  app.get("/api/attendance/student/:studentId", async (req, res) => {
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
  app.get("/api/invoices", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const invoices = await storage.getInvoices(limit);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      console.log("Creating invoice with data:", JSON.stringify(req.body, null, 2));
      
      // Handle both old format and new wizard format
      if (req.body.items && Array.isArray(req.body.items)) {
        // New wizard format with items
        const invoice = await storage.createInvoiceWithItems(req.body);
        res.status(201).json(invoice);
      } else if (req.body.studentId && req.body.total) {
        // Old format - create simple invoice without schema validation
        const invoiceData = {
          id: crypto.randomUUID(),
          invoiceNumber: `INV-${Date.now()}`,
          studentId: req.body.studentId,
          issueDate: new Date(),
          dueDate: new Date(),
          subtotal: req.body.total,
          discountAmount: '0.00',
          total: req.body.total,
          amountPaid: '0.00',
          balanceDue: req.body.total,
          status: 'sent',
          notes: req.body.notes || '',
          createdBy: 'demo-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const invoice = await storage.createInvoice(invoiceData);
        res.status(201).json(invoice);
      } else {
        res.status(400).json({ message: "Invalid invoice data format" });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ 
        message: "Failed to create invoice",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.updateInvoiceWithItems(id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedInvoice = await storage.updateInvoice(id, updates);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Payments routes
  app.get("/api/payments", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const payments = await storage.getPayments(limit);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req: any, res) => {
    try {
      // If this payment is for a specific invoice, use partial payment logic
      if (req.body.invoiceId) {
        const invoice = await storage.getInvoiceById(req.body.invoiceId);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        // Use the billing system's partial payment processing
        const result = await storage.processPartialPayment({
          paymentAmount: parseFloat(req.body.amount),
          studentId: req.body.studentId,
          paymentMethod: req.body.paymentMethod,
          paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
          receivedBy: 'system',
          notes: req.body.notes || '',
          transactionNumber: req.body.transactionNumber || '',
          invoiceId: req.body.invoiceId
        });

        res.status(201).json(result);
      } else {
        // For general payments without specific invoice, create payment with auto-generated receipt
        const validatedData = insertPaymentSchema.parse({
          ...req.body,
          receiptNumber: `RCP-${Date.now()}`,
          paymentDate: new Date(req.body.paymentDate),
          receivedBy: 'system',
        });
        
        const payment = await storage.createPayment(validatedData);
        
        // Try to apply as advance payment to outstanding invoices
        try {
          const outstandingInvoices = await storage.getInvoicesByStudent(req.body.studentId);
          const unpaidInvoices = outstandingInvoices.filter(inv => parseFloat(inv.balanceDue) > 0);
          
          if (unpaidInvoices.length > 0) {
            // Apply payment to oldest invoice first
            const targetInvoice = unpaidInvoices.sort((a, b) => 
              new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
            )[0];
            
            const paymentAmount = parseFloat(req.body.amount);
            const invoiceBalance = parseFloat(targetInvoice.balanceDue);
            const allocationAmount = Math.min(paymentAmount, invoiceBalance);
            
            // Create payment allocation
            await storage.createPaymentAllocation({
              paymentId: payment.id,
              invoiceId: targetInvoice.id,
              amount: allocationAmount.toFixed(2),
            });
            
            // Update invoice
            const newAmountPaid = parseFloat(targetInvoice.amountPaid) + allocationAmount;
            const newBalanceDue = parseFloat(targetInvoice.total) - newAmountPaid;
            
            await storage.updateInvoice(targetInvoice.id, {
              amountPaid: newAmountPaid.toFixed(2),
              balanceDue: newBalanceDue.toFixed(2),
              status: newBalanceDue <= 0 ? 'paid' : 'partial',
            });
          }
        } catch (allocationError) {
          console.error("Error allocating payment:", allocationError);
          // Payment still created successfully, allocation just failed
        }
        
        res.status(201).json(payment);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  // Assessments routes - NO AUTH REQUIRED FOR DEMO
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // Test route to bypass all authentication issues
  app.post("/api/assessments-test", async (req: any, res) => {
    try {
      console.log("Received assessment creation request:", req.body);
      const validatedData = {
        name: req.body.name,
        subjectId: req.body.subjectId,
        totalMarks: req.body.totalMarks,
        assessmentDate: req.body.assessmentDate ? new Date(req.body.assessmentDate) : new Date(),
        description: req.body.description || '',
        teacherId: "demo-teacher-id", // For demo purposes
      };
      
      console.log("Creating assessment with data:", validatedData);
      const assessment = await storage.createAssessment(validatedData);
      console.log("Assessment created successfully:", assessment);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment", error: error.message });
    }
  });

  app.post("/api/assessments", async (req: any, res) => {
    try {
      console.log("Assessment creation request - bypassing auth:", req.body);
      const validatedData = {
        name: req.body.name,
        subjectId: req.body.subjectId,
        totalMarks: req.body.totalMarks,
        assessmentDate: req.body.assessmentDate ? new Date(req.body.assessmentDate) : new Date(),
        description: req.body.description || '',
        teacherId: "demo-teacher-id", // For demo purposes
      };
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment", error: error.message });
    }
  });

  app.post("/api/grades", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertGradeSchema.parse({
        ...req.body,
        enteredBy: "demo-teacher-id", // For demo purposes
      });
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(400).json({ message: "Failed to create grade" });
    }
  });

  app.get("/api/grades/student/:studentId", async (req, res) => {
    try {
      const grades = await storage.getStudentGrades(req.params.studentId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ message: "Failed to fetch student grades" });
    }
  });

  // Cash draw requests routes
  app.get("/api/cash-draw-requests", async (req, res) => {
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
        teacherId: "demo-teacher-id", // For demo purposes
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
        reviewedBy: "demo-finance-user", // For demo purposes
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
  app.get("/api/daily-close/:date", async (req, res) => {
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
        closedBy: "demo-finance-user", // For demo purposes
      };
      const dailyCloseRecord = await storage.createDailyClose(dailyCloseData);
      res.status(201).json(dailyCloseRecord);
    } catch (error) {
      console.error("Error creating daily close:", error);
      res.status(400).json({ message: "Failed to create daily close" });
    }
  });

  // Staff routes (for expense tracking)
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getStaffMembers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const expenses = await storage.getExpenses(limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req: any, res) => {
    try {
      const expenseData = {
        ...req.body,
        enteredBy: "demo-finance-user", // For demo purposes
      };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  // Attendance Management Routes
  
  // Get all classes for a specific date (used by front desk attendance management)
  app.get("/api/classes/all", async (req, res) => {
    try {
      const date = req.query.date as string;
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get all classes for the specified day
      const classes = await storage.getClassesForDay(dayOfWeek);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching all classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get attendance records for a specific class and date
  app.get("/api/attendance", async (req, res) => {
    try {
      const { classId, date } = req.query;
      if (!classId || !date) {
        return res.status(400).json({ message: "Class ID and date are required" });
      }
      
      const attendance = await storage.getAttendanceByClassAndDate(classId as string, date as string);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Create or update attendance record
  app.post("/api/attendance", async (req: any, res) => {
    try {
      const { classId, studentId, attendanceDate, status } = req.body;
      
      if (!classId || !studentId || !attendanceDate || !status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if attendance record already exists
      const existingRecord = await storage.getAttendanceRecord(classId, studentId, attendanceDate);
      
      let attendanceRecord;
      if (existingRecord) {
        // Update existing record
        attendanceRecord = await storage.updateAttendance(existingRecord.id, {
          status,
          markedBy: 'demo-user' // In real app, this would be req.user.id
        });
      } else {
        // Create new record
        attendanceRecord = await storage.createAttendance({
          classId,
          studentId,
          date: new Date(attendanceDate),
          status,
          markedBy: 'demo-user' // In real app, this would be req.user.id
        });
      }
      
      res.status(201).json(attendanceRecord);
    } catch (error) {
      console.error("Error creating/updating attendance:", error);
      res.status(400).json({ message: "Failed to create/update attendance" });
    }
  });

  // Student Portal API Routes - For parent access to view their child's information
  
  // Get comprehensive student information for parent portal
  app.get("/api/students/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student information" });
    }
  });

  // Get student grades and assessments
  app.get("/api/students/:studentId/grades", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get grades with assessment and subject information
      const studentGrades = await db
        .select({
          id: grades.id,
          score: grades.marksObtained,
          maxScore: assessments.totalMarks,
          assessmentName: assessments.name,
          subjectName: subjects.name,
          gradedAt: grades.enteredAt,
          feedback: grades.comments
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
        .where(eq(grades.studentId, studentId))
        .orderBy(desc(grades.enteredAt))
        .limit(20);
      
      res.json(studentGrades);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ message: "Failed to fetch student grades" });
    }
  });

  // Get student attendance records
  app.get("/api/students/:studentId/attendance", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get attendance with class and subject information
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          status: attendance.status,
          attendanceDate: attendance.attendanceDate,
          notes: attendance.notes,
          markedAt: attendance.markedAt,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(attendance)
        .innerJoin(classes, eq(attendance.classId, classes.id))
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(eq(attendance.studentId, studentId))
        .orderBy(desc(attendance.attendanceDate))
        .limit(50);
      
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch student attendance" });
    }
  });

  // Get all enrolled subjects for a student with teacher info
  app.get("/api/students/:studentId/enrolled-subjects", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const enrolledSubjects = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherId: enrollments.teacherId,
          teacherFirstName: users.firstName,
          teacherLastName: users.lastName,
          teacherEmail: users.email,
          baseFee: subjects.baseFee,
          isActive: enrollments.isActive
        })
        .from(enrollments)
        .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
        .leftJoin(users, eq(enrollments.teacherId, users.id))
        .where(and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.isActive, true)
        ))
        .orderBy(subjects.name);
      
      res.json(enrolledSubjects);
    } catch (error) {
      console.error("Error fetching enrolled subjects:", error);
      res.status(500).json({ message: "Failed to fetch enrolled subjects" });
    }
  });

  // Get attendance for a specific subject
  app.get("/api/students/:studentId/attendance/:subjectId", async (req, res) => {
    try {
      const { studentId, subjectId } = req.params;
      
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          status: attendance.status,
          attendanceDate: attendance.attendanceDate,
          notes: attendance.notes,
          markedAt: attendance.markedAt,
          subjectName: subjects.name,
          className: classes.name,
          classTime: classes.startTime
        })
        .from(attendance)
        .innerJoin(classes, eq(attendance.classId, classes.id))
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(and(
          eq(attendance.studentId, studentId),
          eq(subjects.id, subjectId)
        ))
        .orderBy(desc(attendance.attendanceDate))
        .limit(50);
      
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching subject attendance:", error);
      res.status(500).json({ message: "Failed to fetch subject attendance" });
    }
  });

  // Get grades for a specific subject
  app.get("/api/students/:studentId/grades/:subjectId", async (req, res) => {
    try {
      const { studentId, subjectId } = req.params;
      
      const studentGrades = await db
        .select({
          id: grades.id,
          score: grades.marksObtained,
          maxScore: assessments.totalMarks,
          assessmentName: assessments.name,
          subjectName: subjects.name,
          gradedAt: grades.enteredAt,
          feedback: grades.comments
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
        .where(and(
          eq(grades.studentId, studentId),
          eq(subjects.id, subjectId)
        ))
        .orderBy(desc(grades.enteredAt))
        .limit(20);
      
      res.json(studentGrades);
    } catch (error) {
      console.error("Error fetching subject grades:", error);
      res.status(500).json({ message: "Failed to fetch subject grades" });
    }
  });

  // Get student invoices and payment information
  app.get("/api/students/:studentId/invoices", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // For now, return empty array since we don't have invoice data yet
      // This can be implemented when billing system is fully integrated
      res.json([]);
    } catch (error) {
      console.error("Error fetching student invoices:", error);
      res.status(500).json({ message: "Failed to fetch student invoices" });
    }
  });

  // Enhanced Billing System Routes
  
  // Generate monthly invoices
  app.post("/api/billing/generate-monthly", async (req: any, res) => {
    try {
      const { targetDate } = req.body;
      const invoices = await billingService.generateMonthlyInvoices(targetDate);
      res.json({ success: true, invoicesGenerated: invoices.length, invoices });
    } catch (error) {
      console.error("Error generating monthly invoices:", error);
      res.status(500).json({ message: "Failed to generate monthly invoices" });
    }
  });

  // Process advance payment
  app.post("/api/billing/advance-payment", async (req: any, res) => {
    try {
      const { studentId, amount, paymentMethod, notes, transactionNumber } = req.body;
      
      const paymentData = {
        paymentMethod,
        receivedBy: 'demo-user', // req.user.claims.sub,
        notes,
        transactionNumber: paymentMethod === 'bank_transfer' ? transactionNumber : null
      };
      
      const result = await billingService.processAdvancePayment(studentId, amount, paymentData);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error processing advance payment:", error);
      res.status(500).json({ message: "Failed to process advance payment" });
    }
  });

  // Process partial payment
  app.post("/api/billing/partial-payment", async (req: any, res) => {
    try {
      const { invoiceId, amount, paymentMethod, notes, transactionNumber } = req.body;
      
      const paymentData = {
        paymentMethod,
        receivedBy: 'demo-user', // req.user.claims.sub,
        notes,
        transactionNumber: paymentMethod === 'bank_transfer' ? transactionNumber : null
      };
      
      const result = await billingService.processPartialPayment(invoiceId, amount, paymentData);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error processing partial payment:", error);
      res.status(500).json({ message: "Failed to process partial payment" });
    }
  });

  // Generate pro-rated invoice for mid-month enrollment
  app.post("/api/billing/prorated-invoice", async (req: any, res) => {
    try {
      const { studentId, enrollmentDate, isFullMonth } = req.body;
      const invoice = await billingService.generateProRatedInvoice(
        studentId, 
        new Date(enrollmentDate), 
        isFullMonth
      );
      res.json({ success: true, invoice });
    } catch (error) {
      console.error("Error generating pro-rated invoice:", error);
      res.status(500).json({ message: "Failed to generate pro-rated invoice" });
    }
  });

  // Apply invoice adjustment
  app.post("/api/billing/adjustment", async (req: any, res) => {
    try {
      const { invoiceId, type, amount, reason, notes } = req.body;
      
      const adjustment = {
        type,
        amount: parseFloat(amount),
        reason,
        appliedBy: 'demo-user', // req.user.claims.sub,
        notes
      };
      
      const result = await billingService.applyInvoiceAdjustment(invoiceId, adjustment);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error applying invoice adjustment:", error);
      res.status(500).json({ message: "Failed to apply invoice adjustment" });
    }
  });

  // Get student credit balance
  app.get("/api/billing/student-credit/:studentId", async (req, res) => {
    try {
      const credit = await billingService.getStudentCredit(req.params.studentId);
      res.json({ creditBalance: credit });
    } catch (error) {
      console.error("Error fetching student credit:", error);
      res.status(500).json({ message: "Failed to fetch student credit" });
    }
  });

  // Get student ledger
  app.get("/api/billing/student-ledger/:studentId", async (req, res) => {
    try {
      const ledger = await billingService.getStudentLedger(req.params.studentId);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching student ledger:", error);
      res.status(500).json({ message: "Failed to fetch student ledger" });
    }
  });

  // Update invoice status
  app.patch("/api/billing/invoice-status/:invoiceId", async (req, res) => {
    try {
      const result = await billingService.updateInvoiceStatus(req.params.invoiceId);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  // Demo endpoint to test the billing system
  app.post("/api/billing/run-demo", async (req, res) => {
    try {
      const { runBillingDemo } = await import("./billing-demo");
      await runBillingDemo();
      res.json({ 
        success: true, 
        message: "Billing system demo completed successfully. Check console for detailed results." 
      });
    } catch (error) {
      console.error("Error running billing demo:", error);
      res.status(500).json({ message: "Failed to run billing demo" });
    }
  });

  // Digital Diary - Announcement Routes
  
  // Get all announcements (with optional teacher filter)
  app.get("/api/announcements", async (req: any, res) => {
    try {
      // For teachers, only show their own announcements
      let teacherId = req.query.teacherId as string;
      if (req.user?.role === 'teacher') {
        teacherId = req.user.id; // Override to ensure data isolation
      }
      const announcements = await storage.getAnnouncements(teacherId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Create new announcement
  app.post("/api/announcements", async (req: any, res) => {
    try {
      console.log("Creating announcement with data:", req.body);
      
      const announcementData = {
        id: crypto.randomUUID(),
        title: req.body.title,
        content: req.body.content,
        type: req.body.type,
        priority: req.body.priority,
        subjectId: req.body.subjectId || null,
        classId: req.body.classId || null,
        dueDate: req.body.dueDate || null,
        createdBy: req.user?.id || 'demo-user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const announcement = await storage.createAnnouncement(announcementData);
      
      // If recipients are provided, add them
      if (req.body.recipients && req.body.recipients.length > 0) {
        await storage.addAnnouncementRecipients(announcement.id, req.body.recipients);
      }
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(400).json({ 
        message: "Failed to create announcement", 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      });
    }
  });

  // Update announcement
  app.put("/api/announcements/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedAnnouncement = await storage.updateAnnouncement(id, updates);
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  // Delete announcement (soft delete)
  app.delete("/api/announcements/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.json({ success: true, message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Add recipients to announcement
  app.post("/api/announcements/:id/recipients", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ message: "Student IDs array is required" });
      }
      
      await storage.addAnnouncementRecipients(id, studentIds);
      res.json({ success: true, message: "Recipients added successfully" });
    } catch (error) {
      console.error("Error adding announcement recipients:", error);
      res.status(500).json({ message: "Failed to add recipients" });
    }
  });

  // Get announcements for a specific student
  app.get("/api/students/:studentId/announcements", async (req, res) => {
    try {
      const { studentId } = req.params;
      const announcements = await storage.getStudentAnnouncements(studentId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching student announcements:", error);
      res.status(500).json({ message: "Failed to fetch student announcements" });
    }
  });

  // Mark announcement as read
  app.post("/api/announcements/:announcementId/read", async (req: any, res) => {
    try {
      const { announcementId } = req.params;
      const { studentId } = req.body;
      
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }
      
      await storage.markAnnouncementAsRead(announcementId, studentId);
      res.json({ success: true, message: "Announcement marked as read" });
    } catch (error) {
      console.error("Error marking announcement as read:", error);
      res.status(500).json({ message: "Failed to mark announcement as read" });
    }
  });

  // Get announcements for a specific class
  app.get("/api/classes/:classId/announcements", async (req, res) => {
    try {
      const { classId } = req.params;
      const announcements = await storage.getAnnouncementsByClass(classId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching class announcements:", error);
      res.status(500).json({ message: "Failed to fetch class announcements" });
    }
  });

  // Get announcements for a specific subject
  app.get("/api/subjects/:subjectId/announcements", async (req, res) => {
    try {
      const { subjectId } = req.params;
      const announcements = await storage.getAnnouncementsBySubject(subjectId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching subject announcements:", error);
      res.status(500).json({ message: "Failed to fetch subject announcements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
