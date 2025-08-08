import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import type { Student } from "@shared/schema";

export default function ParentPortal() {
  const [selectedChild, setSelectedChild] = useState("");

  const { data: children, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'], // In real implementation, this would filter by parent ID
  });

  const selectedChildData = children?.find(child => child.id === selectedChild);

  // Mock data for demonstration - in real app this would come from APIs
  const childStats = selectedChildData ? {
    feeBalance: Math.floor(Math.random() * 10000),
    attendance: Math.floor(Math.random() * 30) + 70,
    avgGrade: ['A+', 'A', 'B+', 'B', 'C+'][Math.floor(Math.random() * 5)],
    lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
  } : null;

  const recentActivity = [
    {
      title: "Payment Received",
      description: "Monthly fee payment of ₹9,000 processed",
      time: "2 hours ago",
      type: "payment"
    },
    {
      title: "Grade Updated",
      description: "Physics test result: A+ (92%)",
      time: "Yesterday",
      type: "grade"
    },
    {
      title: "Attendance Alert",
      description: "Marked late for Chemistry class",
      time: "2 days ago",
      type: "attendance"
    }
  ];

  if (isLoading) {
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
      {/* Child Selector & Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Parent Portal</CardTitle>
            {children && children.length > 1 && (
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="w-64" data-testid="select-child">
                  <SelectValue placeholder="Select child..." />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName} ({child.classLevel?.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        
        {selectedChildData && childStats && (
          <CardContent>
            {/* Child Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Fee Balance</p>
                      <p className="text-2xl font-bold" data-testid="text-fee-balance">
                        ₹{childStats.feeBalance.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-100" data-testid="text-due-date">
                        Due: {childStats.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <i className="fas fa-credit-card text-3xl text-blue-200"></i>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-700 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Attendance</p>
                      <p className="text-2xl font-bold" data-testid="text-attendance">
                        {childStats.attendance}%
                      </p>
                      <p className="text-sm text-green-100">This month: 23/25 days</p>
                    </div>
                    <i className="fas fa-calendar-check text-3xl text-green-200"></i>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-700 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Average Grade</p>
                      <p className="text-2xl font-bold" data-testid="text-avg-grade">
                        {childStats.avgGrade}
                      </p>
                      <p className="text-sm text-orange-100">Last assessment: A+</p>
                    </div>
                    <i className="fas fa-graduation-cap text-3xl text-orange-200"></i>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {!selectedChild && children && children.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <i className="fas fa-child text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
              <p className="text-gray-600 mb-4">
                Choose a child from the dropdown above to view their information
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3" data-testid={`activity-${index}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'payment' ? 'bg-green-500' :
                      activity.type === 'grade' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900" data-testid={`activity-title-${index}`}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600" data-testid={`activity-description-${index}`}>
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500" data-testid={`activity-time-${index}`}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/attendance">
                  <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-view-attendance">
                    <div className="flex items-center">
                      <i className="fas fa-calendar-check text-blue-600 mr-3"></i>
                      <span className="font-medium text-gray-900">View Attendance</span>
                    </div>
                    <i className="fas fa-arrow-right text-gray-400"></i>
                  </Button>
                </Link>
                
                <Link href="/grades">
                  <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-view-grades">
                    <div className="flex items-center">
                      <i className="fas fa-chart-line text-blue-600 mr-3"></i>
                      <span className="font-medium text-gray-900">View Grades</span>
                    </div>
                    <i className="fas fa-arrow-right text-gray-400"></i>
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-view-fees">
                  <div className="flex items-center">
                    <i className="fas fa-file-invoice text-blue-600 mr-3"></i>
                    <span className="font-medium text-gray-900">Fee Details</span>
                  </div>
                  <i className="fas fa-arrow-right text-gray-400"></i>
                </Button>
                
                <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-download-receipts">
                  <div className="flex items-center">
                    <i className="fas fa-download text-blue-600 mr-3"></i>
                    <span className="font-medium text-gray-900">Download Receipts</span>
                  </div>
                  <i className="fas fa-arrow-right text-gray-400"></i>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-info-circle text-blue-600 mr-3"></i>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Fee Due Reminder</p>
                    <p className="text-xs text-blue-600">Monthly fee payment due in 5 days</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-300" data-testid="button-pay-now">
                  Pay Now
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-600 mr-3"></i>
                  <div>
                    <p className="text-sm font-medium text-green-800">Excellent Attendance</p>
                    <p className="text-xs text-green-600">Your child maintained 95%+ attendance this month</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
