import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeacherEarnings, CashDrawRequest } from "@/types";

export default function Earnings() {
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: earnings, isLoading: earningsLoading } = useQuery<TeacherEarnings>({
    queryKey: ['/api/teacher/earnings'],
  });

  const { data: cashDrawRequests } = useQuery<CashDrawRequest[]>({
    queryKey: ['/api/cash-draw-requests'],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { amount: number; reason: string }) => {
      return await apiRequest('POST', '/api/cash-draw-requests', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cash draw request submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cash-draw-requests'] });
      setRequestAmount("");
      setRequestReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!requestAmount || !requestReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both amount and reason.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(requestAmount);
    if (amount <= 0 || amount > (earnings?.total || 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount within your available earnings.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      amount,
      reason: requestReason,
    });
  };

  const myRequests = cashDrawRequests?.filter(request => 
    request.teacherId === 'current-teacher-id' // This should be the current user's ID
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'fas fa-check-circle text-green-600';
      case 'denied':
        return 'fas fa-times-circle text-red-600';
      case 'pending':
        return 'fas fa-clock text-yellow-600';
      default:
        return 'fas fa-question-circle text-gray-600';
    }
  };

  if (earningsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-percentage text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Base Rate (70%)</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-base-earnings">
                  ₹{earnings?.baseAmount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-plus text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Extra Classes</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-extra-earnings">
                  ₹{earnings?.extraClasses?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-wallet text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-semibold text-purple-600" data-testid="stat-total-earnings">
                  ₹{earnings?.total?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Cash Draw */}
        <Card>
          <CardHeader>
            <CardTitle>Request Cash Draw</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                max={earnings?.total || 0}
                data-testid="input-request-amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: ₹{earnings?.total?.toLocaleString() || '0'}
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for this cash draw request..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={3}
                data-testid="textarea-request-reason"
              />
            </div>

            <Button 
              onClick={handleSubmitRequest}
              disabled={!requestAmount || !requestReason.trim() || createRequestMutation.isPending}
              className="w-full"
              data-testid="button-submit-request"
            >
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>This Month's Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Physics A-Level (24 students)</span>
                <span className="font-semibold">₹12,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Chemistry O-Level (18 students)</span>
                <span className="font-semibold">₹9,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Extra Sessions (5 hours)</span>
                <span className="font-semibold">₹3,500</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t border-blue-200">
                <span className="font-semibold text-blue-800">Total This Month</span>
                <span className="font-bold text-blue-800">₹{earnings?.total?.toLocaleString() || '0'}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full" data-testid="button-download-statement">
                <i className="fas fa-download mr-2"></i>
                Download Statement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myRequests.length > 0 ? myRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50" data-testid={`row-request-${request.id}`}>
                    <td className="px-4 py-3" data-testid={`text-date-${request.id}`}>
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" data-testid={`text-amount-${request.id}`}>
                        ₹{Number(request.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 max-w-xs truncate" data-testid={`text-reason-${request.id}`}>
                        {request.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(request.status)} data-testid={`badge-status-${request.id}`}>
                        <i className={`${getStatusIcon(request.status)} mr-1`}></i>
                        {request.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {request.reviewedAt ? (
                        <div className="text-sm" data-testid={`text-reviewed-${request.id}`}>
                          <p>{new Date(request.reviewedAt).toLocaleDateString()}</p>
                          {request.notes && (
                            <p className="text-xs text-gray-500">{request.notes}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Pending</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-history text-4xl mb-4"></i>
                      <p>No cash draw requests yet</p>
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
