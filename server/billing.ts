import { storage } from "./storage";
import { db } from "./db";
import { invoices, payments, paymentAllocations, invoiceAdjustments, billingSchedules, enrollments, subjects } from "@shared/schema";
import { eq, and, sum, desc, gte, lte, sql } from "drizzle-orm";

export interface BillingService {
  // Standard monthly billing
  generateMonthlyInvoices(targetDate?: string): Promise<any[]>;
  
  // Advance payments
  processAdvancePayment(studentId: string, amount: number, paymentData: any): Promise<any>;
  
  // Partial payments
  processPartialPayment(invoiceId: string, amount: number, paymentData: any): Promise<any>;
  
  // Mid-month enrollment
  generateProRatedInvoice(studentId: string, enrollmentDate: Date, isFullMonth?: boolean): Promise<any>;
  
  // Manual adjustments
  applyInvoiceAdjustment(invoiceId: string, adjustment: any): Promise<any>;
  
  // Credit management
  getStudentCredit(studentId: string): Promise<number>;
  allocatePaymentToInvoices(paymentId: string, allocations: any[]): Promise<any>;
  
  // Invoice management
  updateInvoiceStatus(invoiceId: string): Promise<any>;
  getInvoiceBalance(invoiceId: string): Promise<number>;
}

export class PrimaxBillingService implements BillingService {
  
  /**
   * Generate monthly invoices for all active students on the 1st of the month
   */
  async generateMonthlyInvoices(targetDate?: string): Promise<any[]> {
    const billingDate = targetDate ? new Date(targetDate) : new Date();
    const firstOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1);
    const lastOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0);
    
    // Get all active enrollments
    const activeEnrollments = await db
      .select({
        studentId: enrollments.studentId,
        subjectId: enrollments.subjectId,
        baseFee: subjects.baseFee
      })
      .from(enrollments)
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .where(eq(enrollments.isActive, true));
    
    // Group by student
    const studentEnrollments = activeEnrollments.reduce((acc, enrollment) => {
      if (!acc[enrollment.studentId]) {
        acc[enrollment.studentId] = [];
      }
      acc[enrollment.studentId].push(enrollment);
      return acc;
    }, {} as Record<string, any[]>);
    
    const generatedInvoices = [];
    
    for (const [studentId, studentSubjects] of Object.entries(studentEnrollments)) {
      // Check if student already has an invoice for this billing period
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, studentId),
            eq(invoices.billingPeriodStart, firstOfMonth.toISOString().split('T')[0]),
            eq(invoices.type, 'monthly')
          )
        );
      
      if (existingInvoice.length > 0) {
        continue; // Skip if already billed
      }
      
      // Calculate total monthly fee
      const totalFee = studentSubjects.reduce((sum, subject) => 
        sum + parseFloat(subject.baseFee), 0
      );
      
      // Check for any existing student credit
      const studentCredit = await this.getStudentCredit(studentId);
      const finalAmount = Math.max(0, totalFee - studentCredit);
      
      // Generate invoice
      const invoiceData = {
        studentId,
        invoiceNumber: await this.generateInvoiceNumber(),
        type: 'monthly',
        billingPeriodStart: firstOfMonth.toISOString().split('T')[0],
        billingPeriodEnd: lastOfMonth.toISOString().split('T')[0],
        issueDate: billingDate.toISOString().split('T')[0],
        dueDate: new Date(billingDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from issue
        subtotal: totalFee.toString(),
        discount: '0',
        lateFee: '0',
        adjustments: (studentCredit > 0 ? Math.min(studentCredit, totalFee) : 0).toString(),
        total: finalAmount.toString(),
        amountPaid: '0',
        balanceDue: finalAmount.toString(),
        status: finalAmount > 0 ? 'sent' : 'paid',
        notes: studentCredit > 0 ? `Applied student credit: Rs. ${Math.min(studentCredit, totalFee)}` : null,
        createdBy: 'system'
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // If credit was used, create a payment record for the credit application
      if (studentCredit > 0 && totalFee > 0) {
        const creditUsed = Math.min(studentCredit, totalFee);
        await this.applyCreditToInvoice(invoice.id, creditUsed);
      }
      
      generatedInvoices.push(invoice);
    }
    
    return generatedInvoices;
  }
  
  /**
   * Process advance payments that cover multiple months
   */
  async processAdvancePayment(studentId: string, amount: number, paymentData: any): Promise<any> {
    // Get pending invoices for this student to determine primary invoice for receipt number
    const pendingInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, studentId),
          eq(invoices.status, 'sent')
        )
      )
      .orderBy(invoices.issueDate);
    
    // Use first invoice for receipt number, or fallback for general receipt
    const primaryInvoiceNumber = pendingInvoices.length > 0 ? pendingInvoices[0].invoiceNumber : undefined;
    
    // Create the payment record
    const payment = await storage.createPayment({
      ...paymentData,
      studentId,
      amount: amount.toString(),
      receiptNumber: await this.generateReceiptNumber(primaryInvoiceNumber)
    });
    
    let remainingAmount = amount;
    const allocations = [];
    
    // Allocate payment to existing invoices first
    for (const invoice of pendingInvoices) {
      if (remainingAmount <= 0) break;
      
      const invoiceBalance = parseFloat(invoice.balanceDue);
      const allocationAmount = Math.min(remainingAmount, invoiceBalance);
      
      // Create payment allocation
      await db.insert(paymentAllocations).values({
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: allocationAmount.toString()
      });
      
      // Update invoice
      const newAmountPaid = parseFloat(invoice.amountPaid || '0') + allocationAmount;
      const newBalanceDue = parseFloat(invoice.total) - newAmountPaid;
      
      await db
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toString(),
          balanceDue: newBalanceDue.toString(),
          status: newBalanceDue <= 0 ? 'paid' : 'partial'
        })
        .where(eq(invoices.id, invoice.id));
      
      allocations.push({
        invoiceId: invoice.id,
        amount: allocationAmount,
        invoiceNumber: invoice.invoiceNumber
      });
      
      remainingAmount -= allocationAmount;
    }
    
    // If there's still remaining amount, it becomes student credit for future invoices
    if (remainingAmount > 0) {
      await this.createStudentCredit(studentId, remainingAmount, payment.id);
    }
    
    return {
      payment,
      allocations,
      remainingCredit: remainingAmount
    };
  }
  
  /**
   * Process partial payments against specific invoices
   */
  async processPartialPayment(invoiceId: string, amount: number, paymentData: any): Promise<any> {
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice[0]) {
      throw new Error('Invoice not found');
    }
    
    const currentBalance = parseFloat(invoice[0].balanceDue);
    if (amount > currentBalance) {
      throw new Error('Payment amount exceeds invoice balance');
    }
    
    // Create payment with invoice-based receipt number
    const payment = await storage.createPayment({
      ...paymentData,
      studentId: invoice[0].studentId,
      amount: amount.toString(),
      receiptNumber: await this.generateReceiptNumber(invoice[0].invoiceNumber)
    });
    
    // Create payment allocation
    await db.insert(paymentAllocations).values({
      paymentId: payment.id,
      invoiceId,
      amount: amount.toString()
    });
    
    // Update invoice
    const newAmountPaid = parseFloat(invoice[0].amountPaid || '0') + amount;
    const newBalanceDue = currentBalance - amount;
    
    await db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toString(),
        balanceDue: newBalanceDue.toString(),
        status: newBalanceDue <= 0 ? 'paid' : 'partial'
      })
      .where(eq(invoices.id, invoiceId));
    
    return { payment, invoice: invoice[0], newBalance: newBalanceDue };
  }
  
  /**
   * Generate pro-rated invoice for mid-month enrollment
   */
  async generateProRatedInvoice(studentId: string, enrollmentDate: Date, isFullMonth = false): Promise<any> {
    // Get student enrollments and calculate fees
    const studentEnrollments = await db
      .select({
        subjectId: enrollments.subjectId,
        baseFee: subjects.baseFee
      })
      .from(enrollments)
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.isActive, true)
        )
      );
    
    const totalMonthlyFee = studentEnrollments.reduce((sum, enrollment) => 
      sum + parseFloat(enrollment.baseFee), 0
    );
    
    let finalAmount = totalMonthlyFee;
    let notes = 'Mid-month enrollment - full month fee';
    
    if (!isFullMonth) {
      // Calculate pro-rated amount
      const daysInMonth = new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth() + 1, 0).getDate();
      const remainingDays = daysInMonth - enrollmentDate.getDate() + 1;
      const proRationFactor = remainingDays / daysInMonth;
      
      finalAmount = Math.round(totalMonthlyFee * proRationFactor);
      notes = `Pro-rated fee for ${remainingDays} days of ${daysInMonth} total days`;
    }
    
    const invoiceData = {
      studentId,
      invoiceNumber: await this.generateInvoiceNumber(),
      type: isFullMonth ? 'monthly' : 'prorated',
      billingPeriodStart: enrollmentDate.toISOString().split('T')[0],
      billingPeriodEnd: new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth() + 1, 0).toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: totalMonthlyFee.toString(),
      discount: '0',
      lateFee: '0',
      adjustments: (totalMonthlyFee - finalAmount).toString(),
      total: finalAmount.toString(),
      amountPaid: '0',
      balanceDue: finalAmount.toString(),
      status: 'sent',
      notes,
      createdBy: 'system'
    };
    
    return await storage.createInvoice(invoiceData);
  }
  
  /**
   * Apply manual adjustments to invoices with audit trail
   */
  async applyInvoiceAdjustment(invoiceId: string, adjustment: any): Promise<any> {
    const { type, amount, reason, appliedBy, notes } = adjustment;
    
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice[0]) {
      throw new Error('Invoice not found');
    }
    
    // Create adjustment record for audit trail
    const adjustmentRecord = await db
      .insert(invoiceAdjustments)
      .values({
        invoiceId,
        type,
        amount: amount.toString(),
        reason,
        appliedBy,
        notes
      })
      .returning();
    
    // Update invoice amounts
    const currentTotal = parseFloat(invoice[0].total);
    const currentPaid = parseFloat(invoice[0].amountPaid || '0');
    const currentAdjustments = parseFloat(invoice[0].adjustments || '0');
    
    let newTotal = currentTotal;
    let newAdjustments = currentAdjustments;
    
    if (type === 'discount' || type === 'writeoff') {
      newTotal = currentTotal - amount;
      newAdjustments = currentAdjustments + amount;
    } else if (type === 'late_fee') {
      newTotal = currentTotal + amount;
    } else if (type === 'refund') {
      newTotal = currentTotal - amount;
      newAdjustments = currentAdjustments + amount;
    }
    
    const newBalanceDue = Math.max(0, newTotal - currentPaid);
    const newStatus: 'paid' | 'partial' | 'sent' = newBalanceDue <= 0 ? 'paid' : (currentPaid > 0 ? 'partial' : 'sent');
    
    await db
      .update(invoices)
      .set({
        total: newTotal.toString(),
        adjustments: newAdjustments.toString(),
        balanceDue: newBalanceDue.toString(),
        status: newStatus,
        notes: invoice[0].notes 
          ? `${invoice[0].notes}\n${reason}`
          : reason
      })
      .where(eq(invoices.id, invoiceId));
    
    return { adjustmentRecord: adjustmentRecord[0], updatedInvoice: { newTotal, newBalanceDue, newStatus } };
  }
  
  /**
   * Get comprehensive student ledger with all invoices, payments, and adjustments
   */
  async getStudentLedger(studentId: string): Promise<any> {
    // Get student invoices
    const invoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoices.issueDate));
    
    // Get student payments
    const payments = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.paymentDate));
    
    // Get payment allocations for this student
    const allocations = await db
      .select({
        paymentId: paymentAllocations.paymentId,
        invoiceId: paymentAllocations.invoiceId,
        amount: paymentAllocations.amount,
        paymentDate: payments.paymentDate,
        invoiceNumber: invoices.invoiceNumber,
        receiptNumber: payments.receiptNumber
      })
      .from(paymentAllocations)
      .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
      .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.paymentDate));
    
    // Get invoice adjustments for this student
    const adjustments = await db
      .select({
        id: invoiceAdjustments.id,
        invoiceId: invoiceAdjustments.invoiceId,
        type: invoiceAdjustments.type,
        amount: invoiceAdjustments.amount,
        reason: invoiceAdjustments.reason,
        appliedBy: invoiceAdjustments.appliedBy,
        appliedAt: invoiceAdjustments.appliedAt,
        invoiceNumber: invoices.invoiceNumber
      })
      .from(invoiceAdjustments)
      .innerJoin(invoices, eq(invoiceAdjustments.invoiceId, invoices.id))
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoiceAdjustments.appliedAt));
    
    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balanceDue || '0'), 0);
    const creditBalance = await this.getStudentCredit(studentId);
    
    return {
      studentId,
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        creditBalance
      },
      invoices: invoices.map(inv => ({
        ...inv,
        amount: parseFloat(inv.total),
        amountPaid: parseFloat(inv.amountPaid || '0'),
        balanceDue: parseFloat(inv.balanceDue || '0'),
        adjustments: parseFloat(inv.adjustments || '0')
      })),
      payments: payments.map(pay => ({
        ...pay,
        amount: parseFloat(pay.amount)
      })),
      allocations,
      adjustments
    };
  }

  /**
   * Get student's available credit from overpayments
   */
  async getStudentCredit(studentId: string): Promise<number> {
    // Calculate total payments
    const totalPayments = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.studentId, studentId));
    
    // Calculate total allocated to invoices
    const totalAllocated = await db
      .select({ total: sum(paymentAllocations.amount) })
      .from(paymentAllocations)
      .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
      .where(eq(payments.studentId, studentId));
    
    const paymentsSum = parseFloat(totalPayments[0]?.total || '0');
    const allocatedSum = parseFloat(totalAllocated[0]?.total || '0');
    
    return Math.max(0, paymentsSum - allocatedSum);
  }
  
  /**
   * Get invoice balance considering all payments and adjustments
   */
  async getInvoiceBalance(invoiceId: string): Promise<number> {
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice[0]) return 0;
    
    return parseFloat(invoice[0].balanceDue);
  }
  
  /**
   * Update invoice status based on payments
   */
  async updateInvoiceStatus(invoiceId: string): Promise<any> {
    const balance = await this.getInvoiceBalance(invoiceId);
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice[0]) return null;
    
    const currentPaid = parseFloat(invoice[0].amountPaid || '0');
    let status: 'sent' | 'paid' | 'partial' | 'overdue' = 'sent';
    
    if (balance <= 0) {
      status = 'paid';
    } else if (currentPaid > 0) {
      status = 'partial';
    } else if (new Date() > new Date(invoice[0].dueDate || '')) {
      status = 'overdue';
    }
    
    await db
      .update(invoices)
      .set({ status: status })
      .where(eq(invoices.id, invoiceId));
    
    return { invoiceId, status, balance };
  }
  
  // Helper methods
  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, `INV-${year}${month}%`))
      .orderBy(desc(invoices.createdAt))
      .limit(1);
    
    let sequence = 1;
    if (lastInvoice.length > 0) {
      const lastNum = lastInvoice[0].invoiceNumber.split('-')[1];
      sequence = parseInt(lastNum.slice(6)) + 1;
    }
    
    return `INV-${year}${month}${String(sequence).padStart(4, '0')}`;
  }
  
  async generateReceiptNumber(invoiceNumber?: string): Promise<string> {
    if (invoiceNumber) {
      // Generate invoice-based receipt number: RCP-{InvoiceNumber}-{Sequence}
      const existingReceipts = await db
        .select()
        .from(payments)
        .where(sql`receipt_number LIKE ${`RCP-${invoiceNumber}-%`}`)
        .orderBy(desc(payments.createdAt));
      
      let sequence = 1;
      if (existingReceipts.length > 0) {
        const lastReceiptNum = existingReceipts[0].receiptNumber;
        const lastSequence = lastReceiptNum.split('-').pop();
        if (lastSequence && !isNaN(parseInt(lastSequence))) {
          sequence = parseInt(lastSequence) + 1;
        }
      }
      
      return `RCP-${invoiceNumber}-${String(sequence).padStart(2, '0')}`;
    } else {
      // Clean fallback for advance payments without specific invoice
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      const lastGeneralReceipt = await db
        .select()
        .from(payments)
        .where(sql`receipt_number LIKE ${`RCP-ADV-${year}${month}%`}`)
        .orderBy(desc(payments.createdAt))
        .limit(1);
      
      let sequence = 1;
      if (lastGeneralReceipt.length > 0) {
        const lastNum = lastGeneralReceipt[0].receiptNumber.split('-')[2];
        if (lastNum && lastNum.startsWith(year + month)) {
          sequence = parseInt(lastNum.slice(6)) + 1;
        }
      }
      
      return `RCP-ADV-${year}${month}${String(sequence).padStart(4, '0')}`;
    }
  }
  
  private async createStudentCredit(studentId: string, amount: number, paymentId: string): Promise<void> {
    // For now, credit is tracked as unallocated payment amount
    // In a more complex system, you might have a separate credits table
  }
  
  private async applyCreditToInvoice(invoiceId: string, creditAmount: number): Promise<void> {
    // Create a virtual payment record for credit application
    const creditPayment = await storage.createPayment({
      studentId: '', // Will be filled by the invoice's student
      amount: creditAmount.toString(),
      paymentMethod: 'credit_adjustment',
      receivedBy: 'demo-management-001', // Use a valid user ID for credit adjustments
      notes: 'Applied student credit balance',
      receiptNumber: await this.generateReceiptNumber()
    });
    
    await db.insert(paymentAllocations).values({
      paymentId: creditPayment.id,
      invoiceId,
      amount: creditAmount.toString()
    });
  }
  
  async allocatePaymentToInvoices(paymentId: string, allocations: any[]): Promise<any> {
    const results = [];
    
    for (const allocation of allocations) {
      const { invoiceId, amount } = allocation;
      
      await db.insert(paymentAllocations).values({
        paymentId,
        invoiceId,
        amount: amount.toString()
      });
      
      // Update invoice
      await this.updateInvoiceAfterPayment(invoiceId, amount);
      results.push({ invoiceId, amount });
    }
    
    return results;
  }
  
  private async updateInvoiceAfterPayment(invoiceId: string, paymentAmount: number): Promise<void> {
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice[0]) return;
    
    const newAmountPaid = parseFloat(invoice[0].amountPaid || '0') + paymentAmount;
    const newBalanceDue = parseFloat(invoice[0].total) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';
    
    await db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toString(),
        balanceDue: newBalanceDue.toString(),
        status: newStatus
      })
      .where(eq(invoices.id, invoiceId));
  }
}

export const billingService = new PrimaxBillingService();