import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Payment } from "@shared/schema";

export default function Receipts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a4'>('thermal');

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const filteredPayments = payments?.filter(payment =>
    payment.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // PDF download functionality would be implemented here
    console.log('Downloading PDF...');
  };

  const switchFormat = () => {
    setReceiptFormat(receiptFormat === 'thermal' ? 'a4' : 'thermal');
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
      {!selectedReceipt ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Receipts</CardTitle>
              <div className="relative">
                <Input
                  placeholder="Search receipts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-receipts"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Receipt #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50" data-testid={`row-receipt-${payment.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600" data-testid={`text-receipt-number-${payment.id}`}>
                          {payment.receiptNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3" data-testid={`text-student-${payment.id}`}>
                        Student Name
                      </td>
                      <td className="px-4 py-3" data-testid={`text-date-${payment.id}`}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" data-testid={`text-amount-${payment.id}`}>
                          Rs. {Number(payment.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge data-testid={`badge-method-${payment.id}`}>
                          {payment.paymentMethod.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedReceipt(payment)}
                          data-testid={`button-view-receipt-${payment.id}`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <i className="fas fa-receipt text-4xl mb-4"></i>
                        <p>No receipts found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedReceipt(null)}
                data-testid="button-back-to-list"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to List
              </Button>
              <h2 className="text-2xl font-semibold text-gray-800">Receipt Preview</h2>
            </div>
            <div className="flex space-x-3 no-print">
              <Button variant="outline" onClick={switchFormat} data-testid="button-switch-format">
                <i className="fas fa-exchange-alt mr-2"></i>
                Switch Format
              </Button>
              <Button onClick={handlePrint} data-testid="button-print-receipt">
                <i className="fas fa-print mr-2"></i>
                Print
              </Button>
              <Button variant="secondary" onClick={handleDownloadPDF} data-testid="button-download-pdf">
                <i className="fas fa-download mr-2"></i>
                Download PDF
              </Button>
            </div>
          </div>

          <Tabs value={receiptFormat} onValueChange={(value) => setReceiptFormat(value as 'thermal' | 'a4')}>
            <TabsList className="no-print">
              <TabsTrigger value="thermal">Thermal (80mm)</TabsTrigger>
              <TabsTrigger value="a4">A4 Statement</TabsTrigger>
            </TabsList>

            <TabsContent value="thermal">
              <div className="mx-auto bg-white border border-gray-300 p-4 font-mono text-sm max-w-sm">
                <div className="text-center border-b border-gray-300 pb-2 mb-2">
                  <h3 className="font-bold text-lg">PRIMAX</h3>
                  <p className="text-xs">School Management System</p>
                  <p className="text-xs">123 Education Street, Karachi</p>
                  <p className="text-xs">Tel: +92 21 1234567</p>
                </div>
                
                <div className="space-y-1 border-b border-gray-300 pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span>{selectedReceipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedReceipt.paymentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date(selectedReceipt.paymentDate).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="space-y-1 border-b border-gray-300 pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span>Student Name</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Roll #:</span>
                    <span>STU001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class:</span>
                    <span>A-Level</span>
                  </div>
                </div>
                
                <div className="space-y-1 border-b border-gray-300 pb-2 mb-2">
                  <div className="font-bold text-center">PAYMENT DETAILS</div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>Rs. {Number(selectedReceipt.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span>{selectedReceipt.paymentMethod.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="text-center text-xs space-y-1">
                  <p>Thank you for your payment!</p>
                  <p>Keep this receipt for your records</p>
                  <p>Visit: www.primax.edu.pk</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="a4">
              <div className="mx-auto bg-white border border-gray-300 p-8 max-w-2xl">
                <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">PRIMAX</h2>
                    <p className="text-sm text-gray-600">School Management System</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>123 Education Street, Karachi</p>
                    <p>Tel: +92 21 1234567</p>
                    <p>Email: info@primax.edu.pk</p>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">PAYMENT RECEIPT</h3>
                  <p className="text-sm text-gray-600">Receipt #: {selectedReceipt.receiptNumber}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Student Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> Student Name</p>
                      <p><span className="font-medium">Roll Number:</span> STU001</p>
                      <p><span className="font-medium">Class:</span> A-Level</p>
                      <p><span className="font-medium">Parent Name:</span> Parent Name</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Payment Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Date:</span> {new Date(selectedReceipt.paymentDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Time:</span> {new Date(selectedReceipt.paymentDate).toLocaleTimeString()}</p>
                      <p><span className="font-medium">Method:</span> {selectedReceipt.paymentMethod.toUpperCase()}</p>
                      <p><span className="font-medium">Amount:</span> Rs. {Number(selectedReceipt.amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  <p className="mb-2">Thank you for your payment. This is a computer-generated receipt.</p>
                  <p>For any queries, please contact the finance office.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
