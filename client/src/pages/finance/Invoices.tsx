import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
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
              <Button data-testid="button-create-invoice">
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
                        ₹{Number(invoice.total).toLocaleString()}
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
                        <Button size="sm" variant="ghost" data-testid={`button-view-invoice-${invoice.id}`}>
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-edit-invoice-${invoice.id}`}>
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-green-600" data-testid={`button-record-payment-${invoice.id}`}>
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
    </div>
  );
}
