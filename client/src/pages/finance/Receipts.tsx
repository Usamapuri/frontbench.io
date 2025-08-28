import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPKR } from "@/lib/currency";

export default function Receipts() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced filtering states (same as invoices)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [amountRangeFilter, setAmountRangeFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  const { data: students } = useQuery({
    queryKey: ['/api/students'],
  });

  // Helper function to get student name
  const getStudentName = (studentId: string) => {
    const student = students?.find((s: any) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  // Helper function to get student roll number
  const getStudentRollNumber = (studentId: string) => {
    const student = students?.find((s: any) => s.id === studentId);
    return student?.rollNumber || 'N/A';
  };



  const generatePDFReceipt = async (payment: any) => {
    const studentName = getStudentName(payment.studentId);
    const currentDate = new Date().toLocaleDateString();
    const paymentDate = new Date(payment.paymentDate).toLocaleDateString();
    const paymentTime = new Date(payment.paymentDate).toLocaleTimeString();
    
    const pdfHTML = `
      <html>
        <head>
          <title>Receipt ${payment.receiptNumber}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              color: #333;
              line-height: 1.4;
            }
            .receipt-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0 0 8px 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .receipt-details {
              padding: 30px;
              background: #f8f9fa;
              border-bottom: 2px solid #e9ecef;
            }
            .receipt-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 20px;
            }
            .receipt-info h3 {
              margin: 0 0 15px 0;
              font-size: 16px;
              color: #495057;
              border-bottom: 2px solid #667eea;
              padding-bottom: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 6px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-label {
              font-weight: 500;
              color: #6c757d;
            }
            .info-value {
              font-weight: 600;
              color: #212529;
            }
            .payment-summary {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .amount-display {
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-display .amount {
              font-size: 36px;
              font-weight: 700;
              margin: 10px 0;
            }
            .amount-display .label {
              font-size: 14px;
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .footer {
              padding: 30px;
              text-align: center;
              background: #f8f9fa;
              border-top: 2px solid #e9ecef;
            }
            .footer-note {
              font-size: 12px;
              color: #6c757d;
              margin-bottom: 15px;
              line-height: 1.6;
            }
            .footer-signature {
              font-size: 11px;
              color: #868e96;
              font-style: italic;
            }
            @media print {
              body { print-color-adjust: exact; }
              .receipt-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>PRIMAX</h1>
              <p>Educational Institution - Payment Receipt</p>
            </div>
            
            <div class="receipt-details">
              <div class="receipt-grid">
                <div class="receipt-info">
                  <h3>Receipt Information</h3>
                  <div class="info-row">
                    <span class="info-label">Receipt #:</span>
                    <span class="info-value">${payment.receiptNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment Date:</span>
                    <span class="info-value">${paymentDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment Time:</span>
                    <span class="info-value">${paymentTime}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">${payment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : payment.paymentMethod === 'cash' ? 'Cash' : payment.paymentMethod?.toUpperCase()}</span>
                  </div>
                  ${payment.transactionNumber ? `
                  <div class="info-row">
                    <span class="info-label">Transaction #:</span>
                    <span class="info-value">${payment.transactionNumber}</span>
                  </div>
                  ` : ''}
                </div>
                
                <div class="receipt-info">
                  <h3>Student Information</h3>
                  <div class="info-row">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value">${studentName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Student ID:</span>
                    <span class="info-value">${payment.studentId}</span>
                  </div>
                  ${payment.notes ? `
                  <div class="info-row">
                    <span class="info-label">Notes:</span>
                    <span class="info-value">${payment.notes}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>
            
            <div class="payment-summary">
              <div class="amount-display">
                <div class="label">Amount Received</div>
                <div class="amount">Rs. ${Number(payment.amount).toLocaleString()}</div>
                <div class="label">Payment Confirmed</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-note">
                <strong>Thank you for your payment!</strong><br>
                This receipt serves as proof of payment. Please retain for your records.<br>
                For any queries, contact our finance office during business hours.
              </div>
              <div class="footer-signature">
                Primax Educational Institution<br>
                Generated on ${currentDate} | This is a computer-generated receipt
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

  // Generate thermal receipt format
  const generateThermalReceipt = async (payment: any) => {
    const studentName = getStudentName(payment.studentId);
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const paymentDate = new Date(payment.paymentDate).toLocaleDateString();
    const paymentTime = new Date(payment.paymentDate).toLocaleTimeString();
    
    const thermalHTML = `
      <html>
        <head>
          <title>Receipt ${payment.receiptNumber} - Thermal</title>
          <style>
            @page { 
              size: 80mm 150mm; 
              margin: 2mm; 
            }
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 2mm; 
              font-size: 10px;
              line-height: 1.2;
              color: #000;
            }
            .receipt {
              width: 76mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 3mm;
              border-bottom: 1px dashed #000;
              padding-bottom: 2mm;
            }
            .header h1 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
            }
            .header p {
              margin: 1mm 0 0 0;
              font-size: 8px;
            }
            .section {
              margin: 2mm 0;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 2mm;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 1mm 0;
              font-size: 9px;
            }
            .row-label {
              font-weight: bold;
            }
            .amount-section {
              text-align: center;
              margin: 3mm 0;
              background: #f0f0f0;
              padding: 2mm;
              border: 1px solid #000;
            }
            .amount {
              font-size: 16px;
              font-weight: bold;
              margin: 1mm 0;
            }
            .footer {
              text-align: center;
              margin-top: 3mm;
              font-size: 7px;
              border-top: 1px dashed #000;
              padding-top: 2mm;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>PRIMAX</h1>
              <p>Educational Institution</p>
              <p>PAYMENT RECEIPT</p>
            </div>
            
            <div class="section">
              <div class="row">
                <span class="row-label">Receipt #:</span>
                <span>${payment.receiptNumber}</span>
              </div>
              <div class="row">
                <span class="row-label">Date:</span>
                <span>${paymentDate}</span>
              </div>
              <div class="row">
                <span class="row-label">Time:</span>
                <span>${paymentTime}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="row">
                <span class="row-label">Student:</span>
                <span style="font-size: 8px;">${studentName}</span>
              </div>
              <div class="row">
                <span class="row-label">ID:</span>
                <span>${payment.studentId.substring(0, 8)}...</span>
              </div>
            </div>
            
            <div class="section">
              <div class="row">
                <span class="row-label">Method:</span>
                <span>${payment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : payment.paymentMethod === 'cash' ? 'Cash' : payment.paymentMethod?.toUpperCase()}</span>
              </div>
              ${payment.transactionNumber ? `
              <div class="row">
                <span class="row-label">Trans #:</span>
                <span style="font-size: 7px;">${payment.transactionNumber}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="amount-section">
              <div style="font-size: 10px;">AMOUNT RECEIVED</div>
              <div class="amount">Rs. ${Number(payment.amount).toLocaleString()}</div>
              <div style="font-size: 8px;">PAYMENT CONFIRMED</div>
            </div>
            
            ${payment.notes ? `
            <div class="section">
              <div style="font-size: 8px; text-align: center;">
                ${payment.notes}
              </div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>Generated: ${currentDate} ${currentTime}</p>
              <p>This is a computer-generated receipt</p>
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

  // Enhanced filtering logic (same as invoices)
  const filteredPayments = (payments || []).filter((payment: any) => {
    // Text search across receipt number, student name, and notes
    const studentName = getStudentName(payment.studentId).toLowerCase();
    const searchTerms = searchQuery.toLowerCase();
    const studentRollNumber = payment.studentRollNumber || getStudentRollNumber(payment.studentId);
    const matchesSearch = !searchQuery || 
      payment.receiptNumber?.toLowerCase().includes(searchTerms) ||
      studentName.includes(searchTerms) ||
      studentRollNumber.toLowerCase().includes(searchTerms) ||
      payment.notes?.toLowerCase().includes(searchTerms);

    // Payment method filter
    const matchesPaymentMethod = !paymentMethodFilter || paymentMethodFilter === "all" || payment.paymentMethod === paymentMethodFilter;

    // Student filter
    const matchesStudent = !studentFilter || studentFilter === "all" || payment.studentId === studentFilter;

    // Date range filter
    const matchesDateRange = !dateRangeFilter || dateRangeFilter === "all" || (() => {
      const paymentDate = new Date(payment.paymentDate);
      const today = new Date();
      
      switch (dateRangeFilter) {
        case 'today':
          return paymentDate.toDateString() === today.toDateString();
        case 'this-week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return paymentDate >= weekStart;
        case 'this-month':
          return paymentDate.getMonth() === today.getMonth() && 
                 paymentDate.getFullYear() === today.getFullYear();
        case 'last-30-days':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return paymentDate >= thirtyDaysAgo;
        default:
          return true;
      }
    })();

    // Amount range filter
    const matchesAmountRange = !amountRangeFilter || amountRangeFilter === "all" || (() => {
      const amount = parseFloat(payment.amount);
      
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

    return matchesSearch && matchesPaymentMethod && matchesStudent && matchesDateRange && matchesAmountRange;
  });

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery("");
    setPaymentMethodFilter("all");
    setDateRangeFilter("all");
    setAmountRangeFilter("all");
    setStudentFilter("all");
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'bank_transfer':
        return 'bg-blue-100 text-blue-800';
      case 'card':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <div className="flex items-center justify-between">
            <CardTitle>Payment Receipts</CardTitle>
            <div className="flex space-x-3">
              <Button data-testid="button-export-receipts">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>
          
          {/* Enhanced Search and Filters (same as invoices) */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search receipts, students, roll numbers, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-receipts"
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
              {/* Payment Method Filter */}
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-40" data-testid="select-method-filter">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>

              {/* Student Filter */}
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-48" data-testid="select-student-filter">
                  <SelectValue placeholder="Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {(students || []).map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-36" data-testid="select-date-filter">
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
                <SelectTrigger className="w-36" data-testid="select-amount-filter">
                  <SelectValue placeholder="Amount Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="under-10k">Under Rs. 10K</SelectItem>
                  <SelectItem value="10k-25k">Rs. 10K - 25K</SelectItem>
                  <SelectItem value="25k-50k">Rs. 25K - 50K</SelectItem>
                  <SelectItem value="over-50k">Over Rs. 50K</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(searchQuery || paymentMethodFilter !== "all" || dateRangeFilter !== "all" || amountRangeFilter !== "all" || studentFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  data-testid="button-clear-filters"
                >
                  <i className="fas fa-times mr-2"></i>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results Count */}
            {payments && (
              <div className="text-sm text-gray-600">
                Showing {filteredPayments.length} of {payments.length} receipts
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Receipt #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Roll #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Payment Method</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length > 0 ? filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50" data-testid={`row-payment-${payment.id}`}>
                    <td className="px-4 py-3">
                      <button 
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={() => {
                          // Create format selection dialog first
                          const formatChoice = window.confirm("Choose Receipt Format:\n\nOK = Full PDF Format (A4)\nCancel = Thermal Receipt Format");
                          
                          if (formatChoice) {
                            generatePDFReceipt(payment);
                          } else {
                            generateThermalReceipt(payment);
                          }
                        }}
                        data-testid={`text-receipt-${payment.id}`}
                      >
                        {payment.receiptNumber || 'N/A'}
                      </button>
                    </td>
                    <td className="px-4 py-3" data-testid={`text-roll-number-${payment.id}`}>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.studentRollNumber || getStudentRollNumber(payment.studentId)}
                      </span>
                    </td>
                    <td className="px-4 py-3" data-testid={`text-student-${payment.id}`}>
                      {payment.studentFirstName && payment.studentLastName 
                        ? `${payment.studentFirstName} ${payment.studentLastName}`
                        : getStudentName(payment.studentId)}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-payment-date-${payment.id}`}>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" data-testid={`text-amount-${payment.id}`}>
                        Rs. {Number(payment.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={getPaymentMethodColor(payment.paymentMethod)}
                        data-testid={`badge-method-${payment.id}`}
                      >
                        {payment.paymentMethod === 'bank_transfer' ? 'BANK TRANSFER' : 
                         payment.paymentMethod === 'cash' ? 'CASH' : 
                         payment.paymentMethod?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600" data-testid={`text-notes-${payment.id}`} title={payment.notes || '-'}>
                        {payment.notes || '-'}
                      </span>
                    </td>

                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-receipt text-4xl mb-4"></i>
                      <p>No receipts found</p>
                      {(searchQuery || paymentMethodFilter !== "all" || dateRangeFilter !== "all" || amountRangeFilter !== "all" || studentFilter !== "all") && (
                        <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}