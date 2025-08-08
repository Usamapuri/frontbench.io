import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/currency";

export default function Receipts() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  const filteredPayments = payments?.filter((payment: any) =>
    payment.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
              <Button data-testid="button-export-receipts">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Receipt #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Payment Method</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Transaction #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Notes</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length > 0 ? filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm" data-testid={`text-receipt-${payment.id}`}>
                        {payment.receiptNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3" data-testid={`text-payment-date-${payment.id}`}>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600" data-testid={`text-amount-${payment.id}`}>
                        Rs. {Number(payment.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={getPaymentMethodColor(payment.paymentMethod)}
                        data-testid={`badge-method-${payment.id}`}
                      >
                        {payment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                         payment.paymentMethod === 'cash' ? 'Cash' : 
                         payment.paymentMethod?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600" data-testid={`text-transaction-${payment.id}`}>
                        {payment.transactionNumber || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 truncate max-w-xs" data-testid={`text-notes-${payment.id}`}>
                        {payment.notes || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            // In real app, this would generate/view receipt
                            window.alert(`Receipt ${payment.receiptNumber}\nAmount: Rs. ${Number(payment.amount).toLocaleString()}\nDate: ${new Date(payment.paymentDate).toLocaleDateString()}`);
                          }}
                          data-testid={`button-view-receipt-${payment.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            // In real app, this would print/download receipt
                            window.print();
                          }}
                          data-testid={`button-print-receipt-${payment.id}`}
                        >
                          <i className="fas fa-print"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
    </div>
  );
}