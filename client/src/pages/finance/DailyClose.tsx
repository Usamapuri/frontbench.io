import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DailyClose } from "@shared/schema";

export default function DailyClose() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [totalCash, setTotalCash] = useState("");
  const [totalBank, setTotalBank] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      setSelectedDate(dateString);
      setCalendarDate(date);
      // Clear form when changing dates
      setTotalCash("");
      setTotalBank("");
      setNotes("");
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDateString = currentDate.toISOString().split('T')[0];
    setSelectedDate(newDateString);
    setCalendarDate(currentDate);
    // Clear form when changing dates
    setTotalCash("");
    setTotalBank("");
    setNotes("");
  };

  // Navigate to next day (only if not going into future)
  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    const newDateString = currentDate.toISOString().split('T')[0];
    
    // Only allow navigation if not going into future
    if (newDateString <= today) {
      setSelectedDate(newDateString);
      setCalendarDate(currentDate);
      // Clear form when changing dates
      setTotalCash("");
      setTotalBank("");
      setNotes("");
    }
  };

  const { data: dailyCloseRecord, isLoading } = useQuery<DailyClose | null>({
    queryKey: ['/api/daily-close', selectedDate],
  });

  const { data: payments } = useQuery({
    queryKey: ['/api/payments'],
  });

  const createDailyCloseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/daily-close', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily close completed successfully!",
        variant: "success" as any,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-close'] });
      setTotalCash("");
      setTotalBank("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete daily close. Please try again.",
        variant: "destructive",
      });
    },
  });

  const lockDayMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/daily-close/lock', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily close locked and finalized successfully!",
        variant: "success" as any,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-close'] });
      setTotalCash("");
      setTotalBank("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to lock daily close. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const cash = parseFloat(totalCash) || 0;
    const bank = parseFloat(totalBank) || 0;
    const variance = cash + bank - (expectedTotal || 0);

    createDailyCloseMutation.mutate({
      closeDate: selectedDate,
      totalCash: cash,
      totalBank: bank,
      expectedCash,
      expectedBank,
      expectedTotal,
      actualTotal: cash + bank,
      variance,
      notes,
    });
  };

  const handleLockDay = () => {
    const cash = parseFloat(totalCash) || 0;
    const bank = parseFloat(totalBank) || 0;
    const variance = cash + bank - (expectedTotal || 0);

    const dailyCloseData = {
      closeDate: selectedDate,
      totalCash: cash,
      totalBank: bank,
      expectedCash,
      expectedBank,
      expectedTotal,
      actualTotal: cash + bank,
      variance,
      notes,
    };

    lockDayMutation.mutate({
      closeDate: selectedDate,
      dailyCloseData,
    });
  };

  // Calculate expected totals from payments
  const todaysPayments = payments?.filter((payment: any) => 
    new Date(payment.paymentDate).toDateString() === new Date(selectedDate).toDateString()
  ) || [];

  const expectedCash = todaysPayments
    .filter((p: any) => p.paymentMethod === 'cash')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const expectedBank = todaysPayments
    .filter((p: any) => ['bank_transfer', 'card'].includes(p.paymentMethod))
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const expectedTotal = expectedCash + expectedBank;
  const actualTotal = (parseFloat(totalCash) || 0) + (parseFloat(totalBank) || 0);
  const variance = actualTotal - expectedTotal;
  
  // Check if selected date is in the future
  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate > today;

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
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Close</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="closeDate">Select Date:</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousDay}
                  className="px-3 py-1"
                  data-testid="button-previous-day"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Input
                  id="closeDate"
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    // Clear form when changing dates
                    setTotalCash("");
                    setTotalBank("");
                    setNotes("");
                  }}
                  className="w-48"
                  data-testid="input-close-date"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextDay}
                  disabled={selectedDate >= today}
                  className="px-3 py-1"
                  data-testid="button-next-day"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
              {dailyCloseRecord?.isLocked ? (
                <Badge className="bg-blue-100 text-blue-800" data-testid="badge-locked">
                  <i className="fas fa-lock mr-2"></i>
                  Locked & Finalized
                </Badge>
              ) : (
                <Badge variant="outline" data-testid="badge-unlocked">
                  <i className="fas fa-edit mr-2"></i>
                  Can Edit
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-2"></i>
              You can only complete daily close operations for past and current dates. Future dates cannot be modified. Once locked, dates cannot be modified.
            </div>
            {isFutureDate && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <strong>Future Date Selected:</strong> Daily close operations can only be performed for past and current dates. Please select a date that is today or earlier.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expected Cash</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-expected-cash">
                  Rs. {expectedCash.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-university text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expected Bank</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-expected-bank">
                  Rs. {expectedBank.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-calculator text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expected Total</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-expected-total">
                  Rs. {expectedTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Close Form or Locked View */}
      {dailyCloseRecord?.isLocked ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-lock mr-2 text-blue-600"></i>
              Daily Close Record - Locked & Finalized
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm font-medium">
                <i className="fas fa-info-circle mr-2"></i>
                This date has been locked and finalized. No further changes can be made.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Actual Cash</Label>
                <div className="text-2xl font-semibold" data-testid="text-actual-cash">
                  Rs. {Number(dailyCloseRecord.totalCash).toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Actual Bank</Label>
                <div className="text-2xl font-semibold" data-testid="text-actual-bank">
                  Rs. {Number(dailyCloseRecord.totalBank).toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Variance</Label>
                <div className={`text-2xl font-semibold ${
                  Number(dailyCloseRecord.variance) === 0 ? 'text-green-600' : 
                  Number(dailyCloseRecord.variance) > 0 ? 'text-blue-600' : 'text-red-600'
                }`} data-testid="text-variance">
                  {Number(dailyCloseRecord.variance) > 0 ? '+' : ''}Rs. {Number(dailyCloseRecord.variance).toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Closed At</Label>
                <div className="text-lg" data-testid="text-closed-at">
                  {new Date(dailyCloseRecord.closedAt || '').toLocaleString('en-PK')}
                </div>
              </div>
            </div>
            {dailyCloseRecord.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border" data-testid="text-notes">{dailyCloseRecord.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Record Daily Close for {selectedDate}</CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(selectedDate).toDateString() === new Date().toDateString() 
                ? "Recording daily close for today" 
                : "Recording daily close for a past date - you can complete missed daily closes"}
            </p>
            {isFutureDate && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <i className="fas fa-calendar-times text-red-500 text-2xl mb-2"></i>
                <h3 className="font-medium text-red-800 mb-1">Future Date Not Allowed</h3>
                <p className="text-sm text-red-600">Daily close operations can only be performed for dates up to today. Please select a current or past date.</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isFutureDate ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="totalCash">Actual Cash Total *</Label>
                    <Input
                      id="totalCash"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={totalCash}
                      onChange={(e) => setTotalCash(e.target.value)}
                      data-testid="input-total-cash"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Expected: Rs. {expectedCash.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="totalBank">Actual Bank Total *</Label>
                    <Input
                      id="totalBank"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={totalBank}
                      onChange={(e) => setTotalBank(e.target.value)}
                      data-testid="input-total-bank"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Expected: Rs. {expectedBank.toLocaleString()}
                    </p>
                  </div>
                </div>

                {(totalCash || totalBank) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Actual Total:</span>
                        <div className="font-semibold" data-testid="text-summary-actual">
                          Rs. {actualTotal.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected:</span>
                        <div className="font-semibold" data-testid="text-summary-expected">
                          Rs. {expectedTotal.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Variance:</span>
                        <div className={`font-semibold ${
                          variance === 0 ? 'text-green-600' : 
                          variance > 0 ? 'text-blue-600' : 'text-red-600'
                        }`} data-testid="text-summary-variance">
                          {variance > 0 ? '+' : ''}Rs. {variance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about discrepancies or special circumstances..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={(!totalCash && !totalBank) || createDailyCloseMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    {createDailyCloseMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                  <Button
                    onClick={handleLockDay}
                    disabled={!totalCash || !totalBank || lockDayMutation.isPending}
                    data-testid="button-lock-day"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {lockDayMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Locking Day...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-lock mr-2"></i>
                        Lock Day & Finalize
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Today's Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Receipt #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todaysPayments.length > 0 ? todaysPayments.map((payment: any) => (
                  <tr key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <td className="px-4 py-3" data-testid={`text-time-${payment.id}`}>
                      {new Date(payment.paymentDate).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-receipt-${payment.id}`}>
                      {payment.receiptNumber}
                    </td>
                    <td className="px-4 py-3" data-testid={`text-student-${payment.id}`}>
                      Student Name
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
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No transactions for this date
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
