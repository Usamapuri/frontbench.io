import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
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

  if (!impersonationData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading impersonation session...</p>
      </div>
    );
  }

  return (
    <Layout selectedRole="teacher-impersonation">
      {/* Impersonation Alert */}
      <div className="mb-6">
        <Alert className="bg-orange-50 border-orange-200">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-eye text-orange-600"></i>
              <span className="font-medium text-orange-800">
                Viewing as: {impersonationData.teacherName}
              </span>
              <span className="text-sm text-orange-600">(Read-Only Mode)</span>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Teacher Dashboard Content */}
      <TeacherDashboard />
    </Layout>
  );
}