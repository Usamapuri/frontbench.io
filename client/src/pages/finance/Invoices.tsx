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

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
  });

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
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
        paymentDate: new Date().toISOString(),
        notes: paymentData.notes || `Payment for invoice ${selectedInvoice?.invoiceNumber}`,
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
        notes: `Payment recorded via Invoices page for invoice ${selectedInvoice.invoiceNumber}`,
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
            <CardTitle>Invoices</CardTitle>
            <div className="flex space-x-3">
              <div className="relative">
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-invoices"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <Button 
                onClick={() => setShowCreateInvoiceDialog(true)}
                data-testid="button-create-invoice"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Invoice
              </Button>
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
                {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50" data-testid={`row-invoice-${invoice.id}`}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-blue-600" data-testid={`text-invoice-number-${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span data-testid={`text-student-${invoice.id}`}>Student Name</span>
                    </td>
                    <td className="px-4 py-3" data-testid={`text-issue-date-${invoice.id}`}>
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-due-date-${invoice.id}`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" data-testid={`text-amount-${invoice.id}`}>
                        Rs. {Number(invoice.total).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={getStatusColor(invoice.status || 'draft')}
                        data-testid={`badge-status-${invoice.id}`}
                      >
                        {invoice.status?.toUpperCase() || 'DRAFT'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            toast({
                              title: "Invoice Details",
                              description: `Invoice ${invoice.invoiceNumber} - Rs. ${Number(invoice.total).toLocaleString()}`,
                            });
                          }}
                          data-testid={`button-view-invoice-${invoice.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            toast({
                              title: "Edit Invoice",
                              description: "Invoice editing functionality coming soon",
                            });
                          }}
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
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-file-invoice text-4xl mb-4"></i>
                      <p>No invoices found</p>
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
    </div>
  );
}
