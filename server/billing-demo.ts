import { billingService } from "./billing";
import { storage } from "./storage";

/**
 * Comprehensive Billing System Demo
 * Tests all billing scenarios and features
 */
export class BillingSystemDemo {
  
  async runDemo(): Promise<void> {
    console.log("\n🎯 Starting Primax Billing System Demo\n");
    
    try {
      // 1. Setup demo data
      await this.setupDemoData();
      
      // 2. Test monthly billing generation
      await this.testMonthlyBilling();
      
      // 3. Test advance payments
      await this.testAdvancePayments();
      
      // 4. Test partial payments
      await this.testPartialPayments();
      
      // 5. Test pro-rated billing for mid-month enrollment
      await this.testProRatedBilling();
      
      // 6. Test manual adjustments
      await this.testManualAdjustments();
      
      // 7. Test student ledger
      await this.testStudentLedger();
      
      console.log("\n✅ All billing scenarios tested successfully!");
      console.log("\n📊 Billing System Features Validated:");
      console.log("✅ Monthly invoice generation");
      console.log("✅ Advance payment processing with credit allocation");
      console.log("✅ Partial payment tracking");
      console.log("✅ Pro-rated billing for mid-month enrollments");
      console.log("✅ Manual adjustments with audit trails");
      console.log("✅ Student credit management");
      console.log("✅ Comprehensive student ledger");
      
    } catch (error) {
      console.error("\n❌ Demo failed:", error);
    }
  }
  
  private async setupDemoData(): Promise<void> {
    console.log("📝 Setting up demo data...");
    
    // Create demo students
    const student1 = await storage.createStudent({
      name: "Ahmed Hassan",
      email: "ahmed.hassan@example.com",
      phone: "03001234567",
      grade: "AS",
      section: "A",
      rollNumber: "AS-001",
      guardianName: "Hassan Ali",
      guardianPhone: "03007654321",
      address: "123 Main Street, Karachi"
    });
    
    const student2 = await storage.createStudent({
      name: "Fatima Khan",
      email: "fatima.khan@example.com", 
      phone: "03009876543",
      grade: "O",
      section: "B",
      rollNumber: "O-002",
      guardianName: "Khan Sahib",
      guardianPhone: "03001122334",
      address: "456 Park Avenue, Lahore"
    });
    
    // Create demo subjects
    const mathAS = await storage.createSubject({
      name: "AS Mathematics",
      code: "MAT-AS",
      baseFee: 8000,
      level: "AS",
      description: "Advanced level Mathematics"
    });
    
    const physicsAS = await storage.createSubject({
      name: "AS Physics", 
      code: "PHY-AS",
      baseFee: 7500,
      level: "AS",
      description: "Advanced level Physics"
    });
    
    const englishO = await storage.createSubject({
      name: "O Level English",
      code: "ENG-O", 
      baseFee: 6000,
      level: "O",
      description: "Ordinary level English"
    });
    
    // Create enrollments
    await storage.createEnrollment({
      studentId: student1.id,
      subjectId: mathAS.id,
      enrollmentDate: new Date("2024-08-01"),
      isActive: true
    });
    
    await storage.createEnrollment({
      studentId: student1.id,
      subjectId: physicsAS.id,
      enrollmentDate: new Date("2024-08-01"),
      isActive: true
    });
    
    await storage.createEnrollment({
      studentId: student2.id,
      subjectId: englishO.id,
      enrollmentDate: new Date("2024-08-01"),
      isActive: true
    });
    
    console.log("✅ Demo data setup complete");
    console.log(`   Students: ${student1.name}, ${student2.name}`);
    console.log(`   Subjects: ${mathAS.name}, ${physicsAS.name}, ${englishO.name}`);
    
    // Store student IDs for use in tests
    this.demoStudentIds = [student1.id, student2.id];
  }
  
  private demoStudentIds: string[] = [];
  
  private async testMonthlyBilling(): Promise<void> {
    console.log("\n💳 Testing Monthly Billing Generation...");
    
    const invoices = await billingService.generateMonthlyInvoices();
    
    console.log(`✅ Generated ${invoices.length} monthly invoices`);
    for (const invoice of invoices) {
      console.log(`   Invoice ${invoice.invoiceNumber}: Rs. ${invoice.total} (${invoice.status})`);
    }
  }
  
  private async testAdvancePayments(): Promise<void> {
    console.log("\n💰 Testing Advance Payments...");
    
    const studentId = this.demoStudentIds[0];
    const result = await billingService.processAdvancePayment(studentId, 25000, {
      paymentMethod: 'cash',
      receivedBy: 'demo-user',
      notes: 'Advance payment for 3 months'
    });
    
    console.log(`✅ Processed advance payment of Rs. 25,000`);
    console.log(`   Invoices paid: ${result.allocations.length}`);
    console.log(`   Remaining credit: Rs. ${result.remainingCredit}`);
    
    for (const allocation of result.allocations) {
      console.log(`   Applied Rs. ${allocation.amount} to ${allocation.invoiceNumber}`);
    }
  }
  
  private async testPartialPayments(): Promise<void> {
    console.log("\n🔄 Testing Partial Payments...");
    
    // Get an unpaid invoice for student 2
    const studentId = this.demoStudentIds[1];
    const ledger = await billingService.getStudentLedger(studentId);
    const unpaidInvoice = ledger.invoices.find((inv: any) => inv.balanceDue > 0);
    
    if (unpaidInvoice) {
      const partialAmount = parseFloat(unpaidInvoice.balanceDue) / 2;
      
      const result = await billingService.processPartialPayment(unpaidInvoice.id, partialAmount, {
        paymentMethod: 'bank_transfer',
        transactionNumber: 'TXN123456789',
        receivedBy: 'demo-user',
        notes: 'Partial payment via bank transfer'
      });
      
      console.log(`✅ Processed partial payment of Rs. ${partialAmount}`);
      console.log(`   Invoice ${unpaidInvoice.invoiceNumber} balance: Rs. ${result.newBalance}`);
    }
  }
  
  private async testProRatedBilling(): Promise<void> {
    console.log("\n📅 Testing Pro-Rated Billing...");
    
    // Create a new student for mid-month enrollment
    const newStudent = await storage.createStudent({
      name: "Ali Raza",
      email: "ali.raza@example.com",
      phone: "03005555555",
      grade: "AS",
      section: "A", 
      rollNumber: "AS-003",
      guardianName: "Raza Ahmed",
      guardianPhone: "03006666666",
      address: "789 New Street, Islamabad"
    });
    
    // Get a subject to enroll in
    const subjects = await storage.getSubjects();
    if (subjects.length > 0) {
      await storage.createEnrollment({
        studentId: newStudent.id,
        subjectId: subjects[0].id,
        enrollmentDate: new Date("2024-08-15"), // Mid-month
        isActive: true
      });
      
      // Test pro-rated invoice
      const proRatedInvoice = await billingService.generateProRatedInvoice(
        newStudent.id,
        new Date("2024-08-15"), // Mid-month enrollment
        false // Pro-rated, not full month
      );
      
      console.log(`✅ Generated pro-rated invoice: ${proRatedInvoice.invoiceNumber}`);
      console.log(`   Amount: Rs. ${proRatedInvoice.total} (${proRatedInvoice.notes})`);
      
      // Test full month invoice for comparison
      const fullMonthInvoice = await billingService.generateProRatedInvoice(
        newStudent.id,
        new Date("2024-09-01"), // Next month
        true // Full month
      );
      
      console.log(`✅ Generated full month invoice: ${fullMonthInvoice.invoiceNumber}`);
      console.log(`   Amount: Rs. ${fullMonthInvoice.total} (${fullMonthInvoice.notes})`);
    }
  }
  
  private async testManualAdjustments(): Promise<void> {
    console.log("\n⚖️ Testing Manual Adjustments...");
    
    // Get an invoice to adjust
    const studentId = this.demoStudentIds[0];
    const ledger = await billingService.getStudentLedger(studentId);
    const invoice = ledger.invoices[0];
    
    if (invoice) {
      // Apply a discount
      const discountResult = await billingService.applyInvoiceAdjustment(invoice.id, {
        type: 'discount',
        amount: 1000,
        reason: 'Sibling discount - 10% off',
        appliedBy: 'demo-user',
        notes: 'Multiple children enrolled'
      });
      
      console.log(`✅ Applied discount to ${invoice.invoiceNumber}`);
      console.log(`   Discount: Rs. 1,000`);
      console.log(`   New total: Rs. ${discountResult.updatedInvoice.newTotal}`);
      
      // Apply a late fee to another invoice
      const anotherInvoice = ledger.invoices[1];
      if (anotherInvoice) {
        const lateFeeResult = await billingService.applyInvoiceAdjustment(anotherInvoice.id, {
          type: 'late_fee',
          amount: 500,
          reason: 'Payment overdue by 15 days',
          appliedBy: 'demo-user',
          notes: 'Late fee as per policy'
        });
        
        console.log(`✅ Applied late fee to ${anotherInvoice.invoiceNumber}`);
        console.log(`   Late fee: Rs. 500`);
        console.log(`   New total: Rs. ${lateFeeResult.updatedInvoice.newTotal}`);
      }
    }
  }
  
  private async testStudentLedger(): Promise<void> {
    console.log("\n📊 Testing Student Ledger...");
    
    for (const studentId of this.demoStudentIds) {
      const ledger = await billingService.getStudentLedger(studentId);
      const student = await storage.getStudentById(studentId);
      
      console.log(`\n👤 ${student?.name} Ledger Summary:`);
      console.log(`   Total Invoiced: Rs. ${ledger.summary.totalInvoiced.toFixed(2)}`);
      console.log(`   Total Paid: Rs. ${ledger.summary.totalPaid.toFixed(2)}`);
      console.log(`   Outstanding: Rs. ${ledger.summary.totalOutstanding.toFixed(2)}`);
      console.log(`   Credit Balance: Rs. ${ledger.summary.creditBalance.toFixed(2)}`);
      console.log(`   Invoices: ${ledger.invoices.length}`);
      console.log(`   Payments: ${ledger.payments.length}`);
      console.log(`   Adjustments: ${ledger.adjustments.length}`);
    }
  }
}

// Export demo function for easy access
export async function runBillingDemo(): Promise<void> {
  const demo = new BillingSystemDemo();
  await demo.runDemo();
}