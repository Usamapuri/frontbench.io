import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CashDrawRequest } from "@shared/schema";

export default function CashDrawApprovals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<CashDrawRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<CashDrawRequest[]>({
    queryKey: ['/api/cash-draw-requests'],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return await apiRequest('PATCH', `/api/cash-draw-requests/${id}`, {
        status,
        notes,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success", 
        description: `Request ${variables.status} successfully!`,
        variant: "success" as any,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cash-draw-requests'] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests?.filter(request => {
    const matchesSearch = searchQuery === "" || 
      request.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleApprove = (request: CashDrawRequest) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: 'approved',
      notes: reviewNotes,
    });
  };

  const handleDeny = (request: CashDrawRequest) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: 'denied',
      notes: reviewNotes,
    });
  };

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

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
  const totalAmount = filteredRequests.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-pending-requests">
                  {pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-money-bill-wave text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-total-amount">
                  Rs. {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-list text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-total-requests">
                  {requests?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash Draw Requests</CardTitle>
            <div className="flex space-x-3">
              <div className="relative">
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-requests"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="select-status-filter"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Teacher</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Requested</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50" data-testid={`row-request-${request.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <i className="fas fa-user-tie text-gray-400 mr-3"></i>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`text-teacher-${request.id}`}>
                            {request.teacherName || 'Teacher Name'}
                          </p>
                          <p className="text-xs text-gray-500">ID: {request.teacherId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900" data-testid={`text-amount-${request.id}`}>
                        Rs. {Number(request.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-xs truncate" data-testid={`text-reason-${request.id}`}>
                        {request.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" data-testid={`text-requested-${request.id}`}>
                        <p>{new Date(request.requestedAt).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(request.requestedAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(request.status)} data-testid={`badge-status-${request.id}`}>
                        <i className={`${getStatusIcon(request.status)} mr-1`}></i>
                        {request.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {request.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedRequest(request)}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <i className="fas fa-check mr-1"></i>
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Cash Draw Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p><strong>Teacher:</strong> {request.teacherName}</p>
                                  <p><strong>Amount:</strong> Rs. {Number(request.amount).toLocaleString()}</p>
                                  <p><strong>Reason:</strong> {request.reason}</p>
                                </div>
                                <div>
                                  <Label htmlFor="approveNotes">Approval Notes (Optional)</Label>
                                  <Textarea
                                    id="approveNotes"
                                    placeholder="Add any notes for this approval..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    data-testid="textarea-approve-notes"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleApprove(request)}
                                    disabled={updateRequestMutation.isPending}
                                    data-testid="button-confirm-approve"
                                  >
                                    {updateRequestMutation.isPending ? 'Processing...' : 'Approve Request'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setSelectedRequest(request)}
                                data-testid={`button-deny-${request.id}`}
                              >
                                <i className="fas fa-times mr-1"></i>
                                Deny
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deny Cash Draw Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p><strong>Teacher:</strong> {request.teacherName}</p>
                                  <p><strong>Amount:</strong> Rs. {Number(request.amount).toLocaleString()}</p>
                                  <p><strong>Reason:</strong> {request.reason}</p>
                                </div>
                                <div>
                                  <Label htmlFor="denyNotes">Reason for Denial *</Label>
                                  <Textarea
                                    id="denyNotes"
                                    placeholder="Provide a reason for denying this request..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    required
                                    data-testid="textarea-deny-notes"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleDeny(request)}
                                    disabled={!reviewNotes.trim() || updateRequestMutation.isPending}
                                    data-testid="button-confirm-deny"
                                  >
                                    {updateRequestMutation.isPending ? 'Processing...' : 'Deny Request'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {request.reviewedAt && (
                            <>
                              <p>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</p>
                              {request.notes && <p className="text-xs">Notes: {request.notes}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-inbox text-4xl mb-4"></i>
                      <p>No cash draw requests found</p>
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
