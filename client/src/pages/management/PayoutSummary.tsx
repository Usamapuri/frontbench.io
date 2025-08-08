import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TeacherPayout {
  id: string;
  teacherId: string;
  teacherName: string;
  baseAmount: number;
  extraAmount: number;
  totalAmount: number;
  payoutRate: number;
  isFixed: boolean;
  isPaidOut: boolean;
  month: string;
  year: number;
}

export default function PayoutSummary() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [newRate, setNewRate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // In real implementation, these would come from actual API calls
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const { data: payoutRules } = useQuery({
    queryKey: ['/api/payout-rules'],
  });

  // Mock payout data for demonstration
  const mockPayouts: TeacherPayout[] = [
    {
      id: '1',
      teacherId: 'teacher1',
      teacherName: 'Mr. Tariq Ahmed',
      baseAmount: 21000,
      extraAmount: 3500,
      totalAmount: 24500,
      payoutRate: 70,
      isFixed: true,
      isPaidOut: false,
      month: 'March',
      year: 2024,
    },
    {
      id: '2',
      teacherId: 'teacher2',
      teacherName: 'Ms. Ayesha Malik',
      baseAmount: 18000,
      extraAmount: 2000,
      totalAmount: 20000,
      payoutRate: 65,
      isFixed: false,
      isPaidOut: true,
      month: 'March',
      year: 2024,
    },
    {
      id: '3',
      teacherId: 'teacher3',
      teacherName: 'Mr. Hassan Ali',
      baseAmount: 15000,
      extraAmount: 1500,
      totalAmount: 16500,
      payoutRate: 70,
      isFixed: true,
      isPaidOut: false,
      month: 'March',
      year: 2024,
    },
  ];

  const updatePayoutRateMutation = useMutation({
    mutationFn: async ({ teacherId, rate }: { teacherId: string; rate: number }) => {
      // In real implementation, this would update the payout rule
      return await apiRequest('PATCH', `/api/payout-rules/${teacherId}`, {
        fixedPercentage: rate,
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payout rate updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payout-rules'] });
      setNewRate("");
      setSelectedTeacher("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payout rate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      // In real implementation, this would mark the payout as completed
      console.log('Marking payout as paid:', payoutId);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payout marked as completed!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payout status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateRate = () => {
    if (!selectedTeacher || !newRate) {
      toast({
        title: "Validation Error",
        description: "Please select a teacher and enter a rate.",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(newRate);
    if (rate <= 0 || rate > 100) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid rate between 1-100%.",
        variant: "destructive",
      });
      return;
    }

    updatePayoutRateMutation.mutate({
      teacherId: selectedTeacher,
      rate,
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredPayouts = mockPayouts.filter(payout => 
    payout.month === monthNames[selectedMonth] && payout.year === selectedYear
  );

  const totalPayouts = filteredPayouts.reduce((sum, payout) => sum + payout.totalAmount, 0);
  const pendingPayouts = filteredPayouts.filter(p => !p.isPaidOut).length;
  const completedPayouts = filteredPayouts.filter(p => p.isPaidOut).length;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Teacher Payout Summary</CardTitle>
            <div className="flex space-x-3">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-20" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-manage-rates">
                    <i className="fas fa-cog mr-2"></i>
                    Manage Rates
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Payout Rates</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teacher">Select Teacher</Label>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger data-testid="select-teacher-rate">
                          <SelectValue placeholder="Choose teacher..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredPayouts.map((payout) => (
                            <SelectItem key={payout.teacherId} value={payout.teacherId}>
                              {payout.teacherName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="rate">New Payout Rate (%)</Label>
                      <Input
                        id="rate"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="70"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        data-testid="input-new-rate"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        onClick={handleUpdateRate}
                        disabled={updatePayoutRateMutation.isPending}
                        data-testid="button-update-rate"
                      >
                        {updatePayoutRateMutation.isPending ? 'Updating...' : 'Update Rate'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-dollar-sign text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-total-payouts">
                  ₹{totalPayouts.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-pending-payouts">
                  {pendingPayouts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-completed-payouts">
                  {completedPayouts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-users text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-total-teachers">
                  {filteredPayouts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {monthNames[selectedMonth]} {selectedYear} Payouts
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" data-testid="button-export-payouts">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
              <Button 
                disabled={pendingPayouts === 0}
                data-testid="button-process-all"
              >
                <i className="fas fa-credit-card mr-2"></i>
                Process All Pending
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Teacher</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Base Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Extra Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Total Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayouts.length > 0 ? filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50" data-testid={`row-payout-${payout.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-user-tie text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`teacher-name-${payout.id}`}>
                            {payout.teacherName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payout.isFixed ? 'Fixed Rate' : 'Tiered Rate'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" data-testid={`rate-${payout.id}`}>
                        {payout.payoutRate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" data-testid={`base-amount-${payout.id}`}>
                        ₹{payout.baseAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600" data-testid={`extra-amount-${payout.id}`}>
                        ₹{payout.extraAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600" data-testid={`total-amount-${payout.id}`}>
                        ₹{payout.totalAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={payout.isPaidOut ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        data-testid={`status-${payout.id}`}
                      >
                        <i className={`fas fa-${payout.isPaidOut ? 'check-circle' : 'clock'} mr-1`}></i>
                        {payout.isPaidOut ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" data-testid={`button-view-details-${payout.id}`}>
                          <i className="fas fa-eye"></i>
                        </Button>
                        {!payout.isPaidOut && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => markAsPaidMutation.mutate(payout.id)}
                            disabled={markAsPaidMutation.isPending}
                            data-testid={`button-mark-paid-${payout.id}`}
                          >
                            <i className="fas fa-check mr-1"></i>
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-users text-4xl mb-4"></i>
                      <p>No payout data for selected period</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payout Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Current Payout Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Fixed Rate Teachers</h4>
              {filteredPayouts.filter(p => p.isFixed).map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">{teacher.teacherName}</span>
                  <Badge className="bg-blue-100 text-blue-800">{teacher.payoutRate}%</Badge>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Tiered Rate Teachers</h4>
              {filteredPayouts.filter(p => !p.isFixed).map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">{teacher.teacherName}</span>
                  <div className="text-right">
                    <Badge className="bg-purple-100 text-purple-800">{teacher.payoutRate}%</Badge>
                    <p className="text-xs text-gray-500 mt-1">Base rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
