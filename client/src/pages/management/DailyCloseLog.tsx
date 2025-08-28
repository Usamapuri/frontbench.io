import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar } from "lucide-react";
import type { DailyClose } from "@shared/schema";

export default function DailyCloseLog() {
  const { data: dailyCloses, isLoading } = useQuery<DailyClose[]>({
    queryKey: ["/api/daily-close"],
  });

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
          <p className="text-sm text-gray-600 mt-2">
            Monitor all daily close activities completed by finance staff
          </p>
        </CardHeader>
        <CardContent>
          {!dailyCloses || dailyCloses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Daily Close Records</h3>
              <p className="text-sm">Daily close records will appear here once finance staff completes them</p>
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