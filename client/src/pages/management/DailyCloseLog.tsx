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
import { Eye, FileText, Calendar } from "lucide-react";
import type { DailyClose } from "@shared/schema";

export default function DailyCloseLog() {
  const [selectedRecord, setSelectedRecord] = useState<DailyClose | null>(null);

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
              Daily Close Log
            </CardTitle>
            <Badge variant="outline" className="px-3 py-1">
              {dailyCloses?.length || 0} Records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!dailyCloses || dailyCloses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No daily close records found</p>
              <p className="text-sm">Daily close reports will appear here once finance staff completes them</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Expected Total</TableHead>
                    <TableHead>Actual Total</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyCloses.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatDate(record.closeDate)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(record.expectedTotal || 0)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(record.actualTotal || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getVarianceColor(record.variance || 0)}>
                            {formatCurrency(record.variance || 0)}
                          </span>
                          {getVarianceBadge(record.variance || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.isLocked ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <i className="fas fa-lock mr-1"></i>
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        Finance Staff
                        <br />
                        <span className="text-xs">
                          {new Date(record.closedAt || '').toLocaleString('en-PK')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                            data-testid={`button-view-${record.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {record.pdfPath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(record.pdfPath!, '_blank')}
                              data-testid={`button-pdf-${record.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Close Details Modal */}
      {selectedRecord && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Close Details - {formatDate(selectedRecord.closeDate)}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expected vs Actual */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Expected vs Actual</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Expected Cash:</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.expectedCash || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual Cash:</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.totalCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Bank:</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.expectedBank || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual Bank:</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.totalBank)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Variance:</span>
                    <span className={getVarianceColor(selectedRecord.variance || 0)}>
                      {formatCurrency(selectedRecord.variance || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes and Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="mt-1">
                      {selectedRecord.isLocked ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <i className="fas fa-lock mr-1"></i>
                          Locked & Finalized
                        </Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Closed At:</span>
                    <p className="mt-1">{new Date(selectedRecord.closedAt || '').toLocaleString('en-PK')}</p>
                  </div>
                  {selectedRecord.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}