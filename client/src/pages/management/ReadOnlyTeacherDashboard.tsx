import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TeacherDashboard from "@/pages/teacher/Dashboard";

interface ImpersonationData {
  teacherId: string;
  teacherName: string;
  originalRole: string;
}

export default function ReadOnlyTeacherDashboard() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('impersonatingTeacher');
    if (data) {
      setImpersonationData(JSON.parse(data));
    } else {
      // If no impersonation data, redirect back to management
      window.location.href = '/teacher-impersonation';
    }
  }, []);

  const stopImpersonation = () => {
    sessionStorage.removeItem('impersonatingTeacher');
    window.location.href = '/dashboard';
  };

  if (!impersonationData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading impersonation session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Header */}
      <div className="bg-orange-100 border-b border-orange-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-eye text-orange-600"></i>
              <span className="font-medium text-orange-800">
                Impersonating: {impersonationData.teacherName}
              </span>
            </div>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              Read-Only Mode
            </Badge>
          </div>
          <Button 
            onClick={stopImpersonation} 
            variant="outline" 
            size="sm"
            className="border-orange-300 hover:bg-orange-50"
          >
            <i className="fas fa-times mr-2"></i>
            End Impersonation
          </Button>
        </div>
      </div>

      {/* Read-Only Overlay Wrapper */}
      <div className="relative">
        {/* Overlay to prevent interactions */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <div 
            className="w-full h-full cursor-not-allowed"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              background: 'rgba(0,0,0,0.01)', // Nearly transparent overlay
            }}
          />
        </div>

        {/* Teacher Dashboard Content */}
        <div className="pointer-events-none relative z-0">
          <TeacherDashboard />
        </div>

        {/* Read-only notice for user interactions */}
        <div className="fixed bottom-4 right-4 z-20">
          <Alert className="bg-orange-50 border-orange-200 shadow-lg">
            <AlertDescription className="text-orange-800 text-sm">
              <i className="fas fa-lock mr-2"></i>
              Dashboard is in read-only mode
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}