import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">Primax</CardTitle>
            <CardDescription className="text-lg">School Management System</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center text-gray-600">
              <p>A unified workspace for efficient school management</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <i className="fas fa-users text-blue-600 text-xl mb-2"></i>
                <p className="font-medium">Student Management</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <i className="fas fa-calendar-check text-green-600 text-xl mb-2"></i>
                <p className="font-medium">Attendance Tracking</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <i className="fas fa-file-invoice text-orange-600 text-xl mb-2"></i>
                <p className="font-medium">Billing & Invoices</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <i className="fas fa-chart-line text-purple-600 text-xl mb-2"></i>
                <p className="font-medium">Analytics & Reports</p>
              </div>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
              data-testid="button-sign-in"
            >
              Sign In to Continue
            </Button>
            
            <div className="text-center text-xs text-gray-500">
              <p>Role-based access for Finance, Teachers, Parents & Management</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
