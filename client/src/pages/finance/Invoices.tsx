import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice } from "@shared/schema";
import InvoiceWizard from "@/components/InvoiceWizard";
import { isOverdue, getCurrentPakistanTime, formatPakistanDate } from "@/utils/pakistanTime";

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);
  
  // Advanced filtering states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [amountRangeFilter, setAmountRangeFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
  });

  // Create a map of students by ID for quick lookup
  const studentsMap = students.reduce((acc: any, student: any) => {
    acc[student.id] = student;
    return acc;
  }, {});

  // Function to get student name by ID
  const getStudentName = (studentId: string) => {
    const student = studentsMap[studentId];
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  // Enhanced filtering logic
  const filteredInvoices = invoices?.filter(invoice => {
    // Text search across invoice number, student name, and notes
    const studentName = getStudentName(invoice.studentId).toLowerCase();
    const searchTerms = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerms) ||
      studentName.includes(searchTerms) ||
      invoice.notes?.toLowerCase().includes(searchTerms);

    // Status filter - use actual status including overdue logic
    const matchesStatus = !statusFilter || statusFilter === "all" || getActualStatus(invoice) === statusFilter;

    // Student filter
    const matchesStudent = !studentFilter || studentFilter === "all" || invoice.studentId === studentFilter;

    // Date range filter
    const matchesDateRange = !dateRangeFilter || dateRangeFilter === "all" || (() => {
      const invoiceDate = new Date(invoice.issueDate);
      const today = getCurrentPakistanTime();
      
      switch (dateRangeFilter) {
        case 'today':
          return invoiceDate.toDateString() === today.toDateString();
        case 'this-week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return invoiceDate >= weekStart;
        case 'this-month':
          return invoiceDate.getMonth() === today.getMonth() && 
                 invoiceDate.getFullYear() === today.getFullYear();
        case 'last-30-days':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return invoiceDate >= thirtyDaysAgo;
        default:
          return true;
      }
    })();

    // Amount range filter
    const matchesAmountRange = !amountRangeFilter || amountRangeFilter === "all" || (() => {
      const amount = parseFloat(invoice.total);
      
      switch (amountRangeFilter) {
        case 'under-10k':
          return amount < 10000;
        case '10k-25k':
          return amount >= 10000 && amount <= 25000;
        case '25k-50k':
          return amount >= 25000 && amount <= 50000;
        case 'over-50k':
          return amount > 50000;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesStudent && matchesDateRange && matchesAmountRange;
  }) || [];

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRangeFilter("all");
    setAmountRangeFilter("all");
    setStudentFilter("all");
  };

  // Get filter count for display
  const getFilterCount = () => {
    let count = 0;
    if (statusFilter && statusFilter !== "all") count++;
    if (dateRangeFilter && dateRangeFilter !== "all") count++;
    if (amountRangeFilter && amountRangeFilter !== "all") count++;
    if (studentFilter && studentFilter !== "all") count++;
    return count;
  };

  // Function to determine actual status including overdue logic
  const getActualStatus = (invoice: Invoice) => {
    // If invoice is already paid, keep it as paid
    if (invoice.status === 'paid') {
      return 'paid';
    }
    
    // Check if due date has passed using Pakistan time
    if (isOverdue(invoice.dueDate)) {
      return 'overdue';
    }
    
    // Return original status if not overdue
    return invoice.status || 'sent';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: {
      invoiceId: string;
      studentId: string;
      amount: string;
      paymentMethod: string;
      transactionNumber?: string;
      notes?: string;
    }) => {
      const response = await apiRequest('POST', '/api/payments', {
        studentId: paymentData.studentId,
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionNumber: paymentData.transactionNumber,
        paymentDate: getCurrentPakistanTime().toISOString(),
        notes: paymentData.notes || '',
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment recorded successfully",
        description: `Payment of Rs. ${paymentAmount} recorded for invoice ${selectedInvoice?.invoiceNumber}`,
      });
      
      // Refresh invoice data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students-with-financial'] });
      
      // Reset form
      setPaymentAmount("");
      setPaymentMethod("");
      setTransactionNumber("");
      setPaymentNotes("");
      setShowPaymentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceDue || invoice.total);
    setPaymentMethod("");
    setTransactionNumber("");
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoice || !paymentAmount || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await paymentMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        studentId: selectedInvoice.studentId,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        transactionNumber: transactionNumber || undefined,
        notes: paymentNotes,
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: {
      studentId: string;
      amount: string;
      notes: string;
    }) => {
      return apiRequest('POST', '/api/invoices', {
        studentId: invoiceData.studentId,
        type: 'custom',
        subtotal: invoiceData.amount,
        total: invoiceData.amount,
        notes: invoiceData.notes,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice created successfully",
        description: `Invoice created for Rs. ${invoiceAmount}`,
      });
      
      // Refresh invoice data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      // Reset form
      setSelectedStudentId("");
      setInvoiceAmount("");
      setInvoiceNotes("");
      setShowCreateInvoiceDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvoice = async () => {
    if (!selectedStudentId || !invoiceAmount) {
      toast({
        title: "Missing information",
        description: "Please select a student and enter amount",
        variant: "destructive",
      });
      return;
    }

    await createInvoiceMutation.mutateAsync({
      studentId: selectedStudentId,
      amount: invoiceAmount,
      notes: invoiceNotes || "Custom invoice",
    });
  };

  // Handle invoice PDF view with format options
  const handleViewInvoicePDF = async (invoice: Invoice) => {
    // Create format selection dialog first
    const formatChoice = window.confirm("Choose Invoice Format:\n\nOK = Full PDF Format (A4)\nCancel = Thermal Receipt Format");
    
    if (formatChoice) {
      await generatePDFInvoice(invoice);
    } else {
      await generateThermalInvoice(invoice);
    }
  };

  // Generate full PDF invoice format with detailed line items
  const generatePDFInvoice = async (invoice: Invoice) => {
    const studentName = getStudentName(invoice.studentId);
    const currentDate = new Date().toLocaleDateString();
    
    // Use saved invoice items to show detailed line items with discounts
    let lineItemsHTML = '';
    let subtotalAmount = 0;
    
    try {
      // Check if invoice has items array (new format with discount data)
      if (invoice.items && invoice.items.length > 0) {
        // Use the saved invoice items that include discount information
        for (const item of invoice.items) {
          const unitPrice = parseFloat(item.unitPrice || '0');
          const discountAmount = parseFloat(item.discountAmount || '0');
          const totalPrice = parseFloat(item.totalPrice || item.unitPrice || '0');
          
          subtotalAmount += unitPrice;
          
          // Show original price line
          lineItemsHTML += `
            <div class="line-item">
              <div class="item-description">${item.name} - ${item.description || 'Monthly Tuition'}</div>
              <div class="item-amount">Rs. ${unitPrice.toLocaleString()}</div>
            </div>`;
          
          // Show discount if applicable
          if (discountAmount > 0) {
            const discountText = item.discountType === 'percentage' 
              ? `${item.discountValue}% Discount on ${item.name}`
              : `Rs. ${discountAmount.toLocaleString()} Discount on ${item.name}`;
              
            lineItemsHTML += `
              <div class="line-item discount-item">
                <div class="item-description">${discountText}</div>
                <div class="item-amount discount">-Rs. ${discountAmount.toLocaleString()}</div>
              </div>`;
          }
        }
      } else {
        // Fallback for older invoices without items array
        lineItemsHTML = `
          <div class="line-item">
            <div class="item-description">Tuition Fees</div>
            <div class="item-amount">Rs. ${Number(invoice.subtotal || invoice.total).toLocaleString()}</div>
          </div>`;
        
        const discountAmount = parseFloat(invoice.discountAmount || '0');
        if (discountAmount > 0) {
          lineItemsHTML += `
            <div class="line-item discount-item">
              <div class="item-description">Discount Applied</div>
              <div class="item-amount discount">-Rs. ${discountAmount.toLocaleString()}</div>
            </div>`;
        }
      }
      
    } catch (error) {
      console.error('Error processing invoice items:', error);
      // Fallback to basic display
      lineItemsHTML = `
        <div class="line-item">
          <div class="item-description">Tuition Fees</div>
          <div class="item-amount">Rs. ${Number(invoice.subtotal || invoice.total).toLocaleString()}</div>
        </div>`;
    }
    
    const pdfHTML = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber} - Primax Educational Institution</title>
          <style>
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 30px 40px;
              text-align: center;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 20px solid transparent;
              border-right: 20px solid transparent;
              border-top: 20px solid #1e40af;
            }
            .school-name {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 8px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .school-subtitle {
              font-size: 16px;
              opacity: 0.9;
              font-weight: 300;
            }
            .invoice-title {
              background: #f8fafc;
              padding: 25px 40px;
              border-bottom: 3px solid #e2e8f0;
            }
            .invoice-number {
              font-size: 32px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .invoice-date {
              color: #64748b;
              font-size: 14px;
            }
            .content {
              padding: 40px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1e40af;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .detail-item {
              display: flex;
              flex-direction: column;
            }
            .detail-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
              font-weight: 500;
            }
            .detail-value {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
            }
            .amount-section {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              padding: 30px;
              border-radius: 10px;
              border: 2px solid #cbd5e1;
              text-align: center;
              margin: 30px 0;
            }
            .total-amount {
              font-size: 48px;
              font-weight: 800;
              color: #1e40af;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
            }
            .amount-label {
              font-size: 16px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .payment-details {
              background: #fefce8;
              border: 2px solid #fbbf24;
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
            }
            .payment-title {
              color: #92400e;
              font-weight: 600;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .payment-title::before {
              content: '⚠';
              margin-right: 10px;
              font-size: 20px;
            }
            .payment-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .footer {
              background: #f8fafc;
              padding: 30px 40px;
              text-align: center;
              border-top: 3px solid #e2e8f0;
              color: #64748b;
            }
            .footer-note {
              font-size: 14px;
              margin-bottom: 10px;
            }
            .footer-signature {
              font-size: 12px;
              opacity: 0.8;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-sent { background: #dbeafe; color: #1d4ed8; }
            .status-paid { background: #dcfce7; color: #16a34a; }
            .status-overdue { background: #fee2e2; color: #dc2626; }
            .status-partial { background: #fef3c7; color: #d97706; }
            
            /* Line Items Styles */
            .line-items-section {
              margin: 30px 40px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
            }
            .line-items-header {
              background: #f8fafc;
              padding: 15px 20px;
              border-bottom: 2px solid #e2e8f0;
              font-weight: 600;
              color: #374151;
              display: flex;
              justify-content: space-between;
            }
            .line-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 20px;
              border-bottom: 1px solid #f1f5f9;
            }
            .line-item:last-child {
              border-bottom: none;
            }
            .item-description {
              font-size: 14px;
              color: #374151;
            }
            .item-amount {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
            .addon-item {
              background: #f0f9ff;
            }
            .addon-item .item-description {
              color: #1e40af;
            }
            .discount-item {
              background: #f0fdf4;
            }
            .discount-item .item-description {
              color: #16a34a;
            }
            .discount {
              color: #16a34a !important;
            }
            .totals-section {
              background: #f8fafc;
              padding: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .final-total {
              border-top: 2px solid #1e40af;
              margin-top: 10px;
              padding-top: 10px;
              font-weight: 700;
              font-size: 18px;
              color: #1e40af;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .invoice-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="school-name">PRIMAX EDUCATIONAL INSTITUTION</div>
              <div class="school-subtitle">Excellence in Education Since 2010</div>
            </div>
            
            <div class="invoice-title">
              <div class="invoice-number">INVOICE #${invoice.invoiceNumber}</div>
              <div class="invoice-date">Generated on ${currentDate}</div>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">Student & Invoice Details</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Student Name</div>
                    <div class="detail-value">${studentName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Invoice Status</div>
                    <div class="detail-value">
                      <span class="status-badge status-${getActualStatus(invoice)}">${getActualStatus(invoice).toUpperCase()}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Issue Date</div>
                    <div class="detail-value">${new Date(invoice.issueDate).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Due Date</div>
                    <div class="detail-value">${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
                
                ${invoice.notes ? `
                <div class="detail-item">
                  <div class="detail-label">Description</div>
                  <div class="detail-value">${invoice.notes}</div>
                </div>
                ` : ''}
              </div>
              
              <!-- Detailed Line Items Section -->
              <div class="line-items-section">
                <div class="line-items-header">
                  <span>ITEM DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                ${lineItemsHTML}
                
                <div class="totals-section">
                  <div class="total-line">
                    <span>TOTAL AMOUNT:</span>
                    <span><strong>Rs. ${Number(invoice.total).toLocaleString()}</strong></span>
                  </div>
                  <div class="total-line">
                    <span>Amount Paid:</span>
                    <span>Rs. ${Number(invoice.amountPaid || 0).toLocaleString()}</span>
                  </div>
                  <div class="total-line final-total">
                    <span>BALANCE DUE:</span>
                    <span>Rs. ${Number(invoice.balanceDue || invoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div class="amount-section">
                <div class="total-amount">Rs. ${Number(invoice.balanceDue || invoice.total).toLocaleString()}</div>
                <div class="amount-label">Amount Due</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-note">
                <strong>Payment Instructions:</strong> Please pay by the due date to avoid late fees.<br>
                Contact our finance office for payment methods and assistance.
              </div>
              <div class="footer-signature">
                Thank you for choosing Primax Educational Institution<br>
                Generated on ${currentDate} | This is a computer-generated invoice
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Generate thermal receipt format with detailed line items
  const generateThermalInvoice = async (invoice: Invoice) => {
    const studentName = getStudentName(invoice.studentId);
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Use saved invoice items to show detailed line items with discounts
    let lineItemsHTML = '';
    
    try {
      // Check if invoice has items array (new format with discount data)
      if (invoice.items && invoice.items.length > 0) {
        // Use the saved invoice items that include discount information
        for (const item of invoice.items) {
          const unitPrice = parseFloat(item.unitPrice || '0');
          const discountAmount = parseFloat(item.discountAmount || '0');
          const totalPrice = parseFloat(item.totalPrice || item.unitPrice || '0');
          
          // Show original price line
          lineItemsHTML += `
            <div class="row">
              <span style="font-size: 9px;">${item.name}</span>
              <span>Rs.${unitPrice.toLocaleString()}</span>
            </div>`;
          
          // Show discount if applicable
          if (discountAmount > 0) {
            const discountText = item.discountType === 'percentage' 
              ? `${item.discountValue}% Off ${item.name}`
              : `Rs.${discountAmount.toLocaleString()} Off ${item.name}`;
              
            lineItemsHTML += `
              <div class="row" style="background: #e6ffe6; padding: 0.5mm;">
                <span style="font-size: 8px;">${discountText}</span>
                <span style="color: #008000;">-Rs.${discountAmount.toLocaleString()}</span>
              </div>`;
          }
        }
      } else {
        // Fallback for older invoices without items array
        lineItemsHTML = `
          <div class="row">
            <span style="font-size: 9px;">Tuition Fees</span>
            <span>Rs.${Number(invoice.subtotal || invoice.total).toLocaleString()}</span>
          </div>`;
        
        const discountAmount = parseFloat(invoice.discountAmount || '0');
        if (discountAmount > 0) {
          lineItemsHTML += `
            <div class="row" style="background: #e6ffe6; padding: 0.5mm;">
              <span style="font-size: 8px;">Discount</span>
              <span style="color: #008000;">-Rs.${discountAmount.toLocaleString()}</span>
            </div>`;
        }
      }
      
    } catch (error) {
      console.error('Error processing invoice items:', error);
      // Fallback to basic display
      lineItemsHTML = `
        <div class="row">
          <span style="font-size: 9px;">Tuition Fees</span>
          <span>Rs.${Number(invoice.subtotal || invoice.total).toLocaleString()}</span>
        </div>`;
    }
    
    const thermalHTML = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber} - Thermal</title>
          <style>
            @page { 
              size: 80mm auto;
              margin: 2mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
              color: #000;
              width: 76mm;
              margin: 0 auto;
              background: white;
            }
            .receipt {
              padding: 4mm;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 4mm;
              margin-bottom: 4mm;
            }
            .school-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            .school-address {
              font-size: 9px;
              margin-bottom: 2mm;
            }
            .doc-type {
              font-size: 12px;
              font-weight: bold;
              margin-top: 2mm;
            }
            .section {
              margin-bottom: 3mm;
              padding-bottom: 2mm;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 2mm 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
            }
            .label {
              font-weight: bold;
            }
            .value {
              text-align: right;
            }
            .invoice-num {
              font-size: 13px;
              font-weight: bold;
              text-align: center;
              margin: 2mm 0;
            }
            .student-name {
              text-align: center;
              font-weight: bold;
              margin: 2mm 0;
              text-transform: uppercase;
            }
            .amount-section {
              background: #f0f0f0;
              padding: 2mm;
              text-align: center;
              margin: 3mm 0;
            }
            .total-amount {
              font-size: 16px;
              font-weight: bold;
            }
            .amount-label {
              font-size: 10px;
              margin-top: 1mm;
            }
            .footer {
              text-align: center;
              font-size: 8px;
              margin-top: 4mm;
              padding-top: 2mm;
              border-top: 1px dashed #000;
            }
            .status {
              text-align: center;
              font-weight: bold;
              padding: 1mm;
              margin: 2mm 0;
              border: 1px solid #000;
            }
            .datetime {
              text-align: center;
              font-size: 9px;
              margin-bottom: 2mm;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="school-name">PRIMAX EDUCATIONAL</div>
              <div class="school-name">INSTITUTION</div>
              <div class="school-address">Excellence in Education</div>
              <div class="doc-type">INVOICE</div>
            </div>
            
            <div class="invoice-num">#${invoice.invoiceNumber}</div>
            
            <div class="datetime">${currentDate} ${currentTime}</div>
            
            <div class="divider"></div>
            
            <div class="student-name">${studentName}</div>
            
            <div class="divider"></div>
            
            <div class="section">
              <div class="row">
                <span class="label">Issue Date:</span>
                <span class="value">${new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div class="row">
                <span class="label">Due Date:</span>
                <span class="value">${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="value">${getActualStatus(invoice).toUpperCase()}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section">
              ${invoice.notes ? `
              <div class="row" style="margin-bottom: 2mm;">
                <span style="font-size: 8px;">${invoice.notes}</span>
              </div>
              <div class="divider"></div>
              ` : ''}
              
              <!-- Detailed Line Items -->
              <div style="margin-bottom: 3mm;">
                <div style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 2mm;">INVOICE DETAILS</div>
                <div class="divider"></div>
                ${lineItemsHTML}
                <div class="divider"></div>
              </div>
              
              <div class="row">
                <span class="label">Total Amount:</span>
                <span class="value">Rs. ${Number(invoice.total).toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Amount Paid:</span>
                <span class="value">Rs. ${Number(invoice.amountPaid || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="amount-section">
              <div class="total-amount">Rs. ${Number(invoice.balanceDue || invoice.total).toLocaleString()}</div>
              <div class="amount-label">AMOUNT DUE</div>
            </div>
            
            <div class="status">
              ${getActualStatus(invoice).toUpperCase()}
            </div>
            
            <div class="footer">
              <div>Pay by due date to avoid late fees</div>
              <div style="margin-top: 2mm;">Thank you!</div>
              <div style="margin-top: 2mm;">Generated: ${currentDate}</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(thermalHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Handle invoice editing
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceAmount(invoice.total);
    setInvoiceNotes(invoice.notes || "");
    setShowEditDialog(true);
  };

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: {
      id: string;
      total: string;
      notes: string;
    }) => {
      return apiRequest('PATCH', `/api/invoices/${invoiceData.id}`, {
        total: invoiceData.total,
        subtotal: invoiceData.total,
        balanceDue: (parseFloat(invoiceData.total) - parseFloat(editingInvoice?.amountPaid || '0')).toFixed(2),
        notes: invoiceData.notes,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice updated successfully",
        description: `Invoice ${editingInvoice?.invoiceNumber} has been updated`,
      });
      
      // Refresh invoice data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      // Reset form
      setEditingInvoice(null);
      setInvoiceAmount("");
      setInvoiceNotes("");
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const handleUpdateInvoice = async () => {
    if (!editingInvoice || !invoiceAmount) {
      toast({
        title: "Missing information",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    await updateInvoiceMutation.mutateAsync({
      id: editingInvoice.id,
      total: invoiceAmount,
      notes: invoiceNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Invoices</CardTitle>
            <Button 
              onClick={() => setShowInvoiceWizard(true)}
              data-testid="button-create-invoice"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Invoice
            </Button>
          </div>
          
          {/* Enhanced Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search invoices, students, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-invoices"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="fas fa-times text-gray-400"></i>
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Student Filter */}
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-48" data-testid="select-student-filter">
                  <SelectValue placeholder="Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-40" data-testid="select-date-filter">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Amount Range Filter */}
              <Select value={amountRangeFilter} onValueChange={setAmountRangeFilter}>
                <SelectTrigger className="w-40" data-testid="select-amount-filter">
                  <SelectValue placeholder="Amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="under-10k">Under Rs. 10K</SelectItem>
                  <SelectItem value="10k-25k">Rs. 10K - 25K</SelectItem>
                  <SelectItem value="25k-50k">Rs. 25K - 50K</SelectItem>
                  <SelectItem value="over-50k">Over Rs. 50K</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {getFilterCount() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  data-testid="button-clear-filters"
                >
                  <i className="fas fa-times mr-1"></i>
                  Clear Filters ({getFilterCount()})
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span data-testid="text-results-count">
                Showing {filteredInvoices.length} of {invoices?.length || 0} invoices
              </span>
              
              {(searchQuery || getFilterCount() > 0) && (
                <span className="text-blue-600" data-testid="text-active-filters">
                  <i className="fas fa-filter mr-1"></i>
                  Filters active
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Invoice #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Issue Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                    </tr>
                  ))
                ) : filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50" data-testid={`row-invoice-${invoice.id}`}>
                    <td className="px-4 py-3">
                      <button 
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={() => handleViewInvoicePDF(invoice)}
                        data-testid={`text-invoice-number-${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3" data-testid={`text-student-${invoice.id}`}>
                      {getStudentName(invoice.studentId)}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-issue-date-${invoice.id}`}>
                      {formatPakistanDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-due-date-${invoice.id}`}>
                      {formatPakistanDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" data-testid={`text-amount-${invoice.id}`}>
                        Rs. {Number(invoice.total).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={getStatusColor(getActualStatus(invoice))}
                        data-testid={`badge-status-${invoice.id}`}
                      >
                        {getActualStatus(invoice).toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditInvoice(invoice)}
                          data-testid={`button-edit-invoice-${invoice.id}`}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600" 
                          onClick={() => handleRecordPayment(invoice)}
                          data-testid={`button-record-payment-${invoice.id}`}
                        >
                          <i className="fas fa-dollar-sign"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <i className="fas fa-search text-gray-300 text-3xl"></i>
                        <p className="font-medium">No invoices found</p>
                        <p className="text-sm">
                          {searchQuery || getFilterCount() > 0 
                            ? "Try adjusting your search or filters" 
                            : "No invoices have been created yet"}
                        </p>
                        {(searchQuery || getFilterCount() > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="mt-2"
                          >
                            <i className="fas fa-times mr-1"></i>
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Recording payment for invoice: <strong>{selectedInvoice.invoiceNumber}</strong>
                <br />
                Current balance: <strong>Rs. {Number(selectedInvoice.balanceDue || selectedInvoice.total).toLocaleString()}</strong>
              </div>
              <div>
                <Label htmlFor="amount">Payment Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-payment-amount"
                />
              </div>
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Transaction Number for Bank Transfer */}
              {paymentMethod === "bank_transfer" && (
                <div>
                  <Label htmlFor="transactionNumber">Transaction Number</Label>
                  <Input
                    id="transactionNumber"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    placeholder="Enter bank transaction number"
                    className="mt-1"
                    data-testid="input-transaction-number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the bank transaction/reference number for this transfer
                  </p>
                </div>
              )}
              
              {/* Notes Field */}
              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Input
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes for this payment receipt"
                  className="mt-1"
                  data-testid="input-payment-notes"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes will appear on the payment receipt
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitPayment}
                  data-testid="button-submit-payment"
                >
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice - {editingInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAmount">Invoice Amount (Rs.)</Label>
              <Input
                id="editAmount"
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1"
                data-testid="input-edit-amount"
              />
            </div>
            <div>
              <Label htmlFor="editNotes">Notes (Optional)</Label>
              <Input
                id="editNotes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Add notes for this invoice"
                className="mt-1"
                data-testid="input-edit-notes"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateInvoice}
                disabled={updateInvoiceMutation.isPending}
                data-testid="button-save-invoice"
              >
                {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger data-testid="select-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} (Roll #{student.rollNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Invoice Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-invoice-amount"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Invoice description or notes"
                data-testid="input-invoice-notes"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateInvoiceDialog(false)}
                data-testid="button-cancel-invoice"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                disabled={createInvoiceMutation.isPending}
                data-testid="button-submit-invoice"
              >
                {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Creation/Edit Wizard */}
      <InvoiceWizard
        open={showInvoiceWizard}
        onOpenChange={(open) => {
          setShowInvoiceWizard(open);
          if (!open) {
            setEditingInvoice(null);
          }
        }}
        editingInvoice={editingInvoice}
      />
    </div>
  );
}
