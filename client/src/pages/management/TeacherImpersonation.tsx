import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isTeacher: boolean;
  subjects?: string[];
}

export default function TeacherImpersonation() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { toast } = useToast();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["/api/staff"],
    select: (data: Teacher[]) => data.filter(staff => staff.isTeacher)
  });

  const handleImpersonate = (teacherId: string) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    if (!teacher) return;

    // Set special session flag for impersonation mode
    sessionStorage.setItem('impersonatingTeacher', JSON.stringify({
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      originalRole: 'management'
    }));

    // Navigate to teacher dashboard in read-only mode
    window.location.href = '/teacher-view-readonly';
    
    toast({
      title: "Teacher Impersonation Started",
      description: `Now viewing as ${teacher.firstName} ${teacher.lastName}`,
    });
  };

  const stopImpersonation = () => {
    sessionStorage.removeItem('impersonatingTeacher');
    setIsImpersonating(false);
    window.location.href = '/dashboard';
    
    toast({
      title: "Impersonation Ended",
      description: "Returned to Management Dashboard",
    });
  };

  // Check if currently impersonating
  const impersonationData = sessionStorage.getItem('impersonatingTeacher');
  const currentImpersonation = impersonationData ? JSON.parse(impersonationData) : null;

  if (currentImpersonation) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Currently impersonating:</strong> {currentImpersonation.teacherName}
              <br />
              <span className="text-sm text-gray-600">You are viewing the system as this teacher (read-only mode)</span>
            </div>
            <Button onClick={stopImpersonation} variant="outline" size="sm">
              End Impersonation
            </Button>
          </AlertDescription>
        </Alert>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Teacher Dashboard View</h2>
          <p className="text-gray-600 mb-6">This would show the teacher's dashboard in read-only mode</p>
          <Badge variant="secondary">Read-Only Mode Active</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Impersonation</h1>
        <p className="text-gray-600">
          Select a teacher to view their dashboard as they would see it. This is read-only access for supervision purposes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-chalkboard-teacher text-blue-600"></i>
            Select Teacher to Impersonate
          </CardTitle>
          <CardDescription>
            Choose from the list of active teachers to view their dashboard perspective
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading teachers...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Teachers
                  </label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher to impersonate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{teacher.firstName} {teacher.lastName}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {teacher.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTeacher && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Impersonation Details</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You will see the Teacher Dashboard exactly as this teacher sees it</li>
                      <li>• Access is read-only - you cannot make any changes</li>
                      <li>• This session will be logged for audit purposes</li>
                      <li>• Click "End Impersonation" to return to your dashboard</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleImpersonate(selectedTeacher)}
                  disabled={!selectedTeacher}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-eye mr-2"></i>
                  Start Impersonation
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {teachers && teachers.length === 0 && (
        <Alert className="mt-6">
          <AlertDescription>
            No teachers found in the system. Teachers must be created in Staff Management first.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}