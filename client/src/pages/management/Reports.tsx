import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Payment, Invoice, Student } from "@shared/schema";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("monthly");

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const handleExportPDF = (reportName: string) => {
    console.log(`Exporting ${reportName} as PDF...`);
  };

  const handleExportCSV = (reportName: string) => {
    console.log(`Exporting ${reportName} as CSV...`);
  };

  // Calculate financial metrics
  const currentMonth = new Date();
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  
  const currentMonthRevenue = payments?.filter(p => 
    new Date(p.paymentDate).getMonth() === currentMonth.getMonth()
  ).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const lastMonthRevenue = payments?.filter(p => 
    new Date(p.paymentDate).getMonth() === lastMonth.getMonth()
  ).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const totalOutstanding = invoices?.filter(i => 
    i.status === 'sent' || i.status === 'overdue'
  ).reduce((sum, i) => sum + Number(i.total), 0) || 0;

  const overdueAmount = invoices?.filter(i => 
    i.status === 'overdue'
  ).reduce((sum, i) => sum + Number(i.total), 0) || 0;

  const revenueGrowth = lastMonthRevenue > 0 ? 
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month Revenue</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-current-revenue">
                  Rs. {currentMonthRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-chart-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className={`text-2xl font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="stat-growth-rate">
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <i className="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-outstanding">
                  Rs. {totalOutstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <i className="fas fa-clock text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-overdue">
                  Rs. {overdueAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full" data-testid="button-generate-report">
                <i className="fas fa-chart-bar mr-2"></i>
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pl">P&L Statement</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="collection">Collection Report</TabsTrigger>
          <TabsTrigger value="student">Student Report</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profit & Loss Statement</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleExportPDF('P&L Statement')} data-testid="button-export-pl-pdf">
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('P&L Statement')} data-testid="button-export-pl-csv">
                    <i className="fas fa-file-csv mr-2"></i>
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Revenue</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Student Fees</span>
                      <span className="font-semibold">Rs. {currentMonthRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Fees</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.02).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total Revenue</span>
                      <span>Rs. {(currentMonthRevenue * 1.02).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Expenses</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Teacher Salaries</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.6).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Administrative</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total Expenses</span>
                      <span>Rs. {(currentMonthRevenue * 0.75).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-blue-800">Net Profit</h4>
                    <span className="text-xl font-bold text-blue-800" data-testid="text-net-profit">
                      Rs. {(currentMonthRevenue * 0.27).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Aging Receivables Report</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleExportPDF('Aging Report')} data-testid="button-export-aging-pdf">
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('Aging Report')} data-testid="button-export-aging-csv">
                    <i className="fas fa-file-csv mr-2"></i>
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Age Group</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Number of Invoices</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr data-testid="row-current">
                      <td className="px-4 py-3">Current (0-30 days)</td>
                      <td className="px-4 py-3">45</td>
                      <td className="px-4 py-3 font-semibold">Rs. 2,25,000</td>
                      <td className="px-4 py-3">75%</td>
                    </tr>
                    <tr data-testid="row-30-60">
                      <td className="px-4 py-3">31-60 days</td>
                      <td className="px-4 py-3">12</td>
                      <td className="px-4 py-3 font-semibold">Rs. 54,000</td>
                      <td className="px-4 py-3">18%</td>
                    </tr>
                    <tr data-testid="row-60-90">
                      <td className="px-4 py-3">61-90 days</td>
                      <td className="px-4 py-3">5</td>
                      <td className="px-4 py-3 font-semibold">Rs. 18,000</td>
                      <td className="px-4 py-3">6%</td>
                    </tr>
                    <tr data-testid="row-90-plus">
                      <td className="px-4 py-3">90+ days</td>
                      <td className="px-4 py-3">2</td>
                      <td className="px-4 py-3 font-semibold">Rs. 3,000</td>
                      <td className="px-4 py-3">1%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Collection Report</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleExportPDF('Collection Report')} data-testid="button-export-collection-pdf">
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('Collection Report')} data-testid="button-export-collection-csv">
                    <i className="fas fa-file-csv mr-2"></i>
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Collection by Method</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.6).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank Transfer</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.3).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Card</span>
                      <span className="font-semibold">Rs. {(currentMonthRevenue * 0.1).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Collection Efficiency</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Collection Rate</span>
                      <span className="font-semibold">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Days to Collect</span>
                      <span className="font-semibold">12 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bad Debt %</span>
                      <span className="font-semibold">0.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Cash</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Bank</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Card</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((day) => (
                      <tr key={day} data-testid={`row-collection-${day}`}>
                        <td className="px-4 py-3">{new Date(Date.now() - day * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        <td className="px-4 py-3">Rs. {(15000 + day * 1000).toLocaleString()}</td>
                        <td className="px-4 py-3">Rs. {(8000 + day * 500).toLocaleString()}</td>
                        <td className="px-4 py-3">Rs. {(2000 + day * 200).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold">Rs. {(25000 + day * 1700).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Analytics Report</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleExportPDF('Student Report')} data-testid="button-export-student-pdf">
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('Student Report')} data-testid="button-export-student-csv">
                    <i className="fas fa-file-csv mr-2"></i>
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Enrollment by Class</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>O-Level</span>
                      <span className="font-semibold">{students?.filter(s => s.classLevel === 'o-level').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A-Level</span>
                      <span className="font-semibold">{students?.filter(s => s.classLevel === 'a-level').length || 0}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>{students?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Fee Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Paid Up</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.85)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.03)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Attendance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Excellent (90%+)</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.7)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Good (75-89%)</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.25)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Poor (&lt;75%)</span>
                      <span className="font-semibold">{Math.floor((students?.length || 0) * 0.05)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
