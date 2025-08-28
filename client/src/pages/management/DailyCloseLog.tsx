import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyClose } from "@shared/schema";

export default function DailyCloseLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { data: allDailyCloses, isLoading } = useQuery<DailyClose[]>({
    queryKey: ["/api/daily-close"],
  });

  // Filter records for the current month
  const dailyCloses = allDailyCloses?.filter((record) => {
    const recordDate = new Date(record.closeDate);
    return recordDate.getMonth() === currentMonth.getMonth() && 
           recordDate.getFullYear() === currentMonth.getFullYear();
  }) || [];

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    // Only allow navigation to next month if it's not in the future
    if (nextMonth <= today) {
      setCurrentMonth(nextMonth);
    }
  };

  const canGoToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    return nextMonth <= today;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-PK', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getVarianceColor = (variance: number | string) => {
    const numVariance = typeof variance === 'string' ? parseFloat(variance) : variance;
    if (numVariance > 0) return "text-green-600";
    if (numVariance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getVarianceBadge = (variance: number | string) => {
    const numVariance = typeof variance === 'string' ? parseFloat(variance) : variance;
    if (numVariance === 0) return <Badge variant="secondary">Perfect Match</Badge>;
    if (numVariance > 0) return <Badge className="bg-green-100 text-green-800">Surplus</Badge>;
    return <Badge variant="destructive">Shortage</Badge>;
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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Close Records
            </CardTitle>
            <Badge variant="outline" className="px-3 py-1">
              {dailyCloses?.length || 0} Records
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Monitor all daily close activities completed by finance staff
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="px-3 py-1"
                data-testid="button-previous-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-gray-50 rounded border min-w-[140px] text-center">
                {formatMonthYear(currentMonth)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                disabled={!canGoToNextMonth()}
                className="px-3 py-1"
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!dailyCloses || dailyCloses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Daily Close Records for {formatMonthYear(currentMonth)}</h3>
              <p className="text-sm">Daily close records for this month will appear here once finance staff completes them</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expected Cash</TableHead>
                  <TableHead>Actual Cash</TableHead>
                  <TableHead>Expected Bank</TableHead>
                  <TableHead>Actual Bank</TableHead>
                  <TableHead>Total Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyCloses.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {formatDate(record.closeDate)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.expectedCash || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.totalCash)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.expectedBank || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.totalBank)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={getVarianceColor(record.variance || 0)}>
                          {record.variance && Number(record.variance) > 0 ? '+' : ''}
                          {formatCurrency(record.variance || 0)}
                        </span>
                        {getVarianceBadge(record.variance || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.isLocked ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <i className="fas fa-lock mr-1"></i>
                          Finalized
                        </Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.closedAt ? new Date(record.closedAt).toLocaleString('en-PK') : 'In Progress'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}