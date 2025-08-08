import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { billingService } from "./billing";
import { 
  insertStudentSchema, 
  insertInvoiceSchema, 
  insertPaymentSchema,
  insertAttendanceSchema,
  insertAssessmentSchema,
  insertGradeSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock auth route for demo
  app.get('/api/auth/user', async (req: any, res) => {
    res.json({
      id: 'demo-user',
      role: 'finance',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@primax.school'
    });
  });

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
      
      // Automatically create an invoice for the new student
      try {
        // Get subject enrollments for this student
        const enrollments = await storage.getEnrollmentsByStudent(student.id);
        
        if (enrollments.length > 0) {
          // Calculate total tuition from enrollments
          let totalTuition = 0;
          let subjects = [];
          
          for (const enrollment of enrollments) {
            const subject = await storage.getSubjectById(enrollment.subjectId);
            if (subject) {
              totalTuition += parseFloat(subject.fee);
              subjects.push(subject.name);
            }
          }
          
          if (totalTuition > 0) {
            // Create initial invoice for new student
            await storage.createInvoice({
              studentId: student.id,
              invoiceNumber: `INV-${Date.now()}`,
              type: 'monthly',
              billingPeriodStart: new Date().toISOString(),
              billingPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
              issueDate: new Date().toISOString(),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              subtotal: totalTuition.toFixed(2),
              total: totalTuition.toFixed(2),
              amountPaid: '0.00',
              balanceDue: totalTuition.toFixed(2),
              status: 'sent',
              notes: `Initial invoice for ${subjects.join(', ')}`,
              createdBy: 'system'
            });
          }
        }
      } catch (invoiceError) {
        console.error("Error creating initial invoice:", invoiceError);
        // Don't fail student creation if invoice creation fails
      }
      
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
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

  // Teacher routes
  app.get("/api/teacher/classes/today", async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const classes = await storage.getTodayClasses(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({ message: "Failed to fetch today's classes" });
    }
  });

  app.get("/api/teacher/earnings", async (req: any, res) => {
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
  app.post("/api/attendance", async (req: any, res) => {
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
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
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
          transactionNumber: req.body.transactionNumber || null,
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

  // Grades routes
  app.post("/api/assessments", async (req: any, res) => {
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

  app.post("/api/grades", async (req: any, res) => {
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

  app.post("/api/cash-draw-requests", async (req: any, res) => {
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

  app.patch("/api/cash-draw-requests/:id", async (req: any, res) => {
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
  app.get("/api/daily-close/:date", async (req, res) => {
    try {
      const dailyCloseRecord = await storage.getDailyClose(req.params.date);
      res.json(dailyCloseRecord || null);
    } catch (error) {
      console.error("Error fetching daily close:", error);
      res.status(500).json({ message: "Failed to fetch daily close" });
    }
  });

  app.post("/api/daily-close", async (req: any, res) => {
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
        enteredBy: req.user.claims.sub,
      };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Failed to create expense" });
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

  const httpServer = createServer(app);
  return httpServer;
}
