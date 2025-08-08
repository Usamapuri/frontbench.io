import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  profileImageUrl?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceMethod, setAttendanceMethod] = useState<'tap' | 'qr'>('tap');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayClasses } = useQuery({
    queryKey: ['/api/teacher/classes/today'],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/classes', selectedClass, 'students'],
    enabled: !!selectedClass,
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: async () => {
      const promises = attendanceRecords.map(record => 
        apiRequest('POST', '/api/attendance', {
          classId: selectedClass,
          studentId: record.studentId,
          attendanceDate: new Date().toISOString().split('T')[0],
          status: record.status,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setAttendanceRecords([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.studentId === studentId);
      if (existing) {
        return prev.map(r => r.studentId === studentId ? { ...r, status } : r);
      }
      return [...prev, { studentId, status }];
    });
  };

  const undoMark = (studentId: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.studentId !== studentId));
  };

  const getStudentStatus = (studentId: string): 'present' | 'absent' | 'late' | undefined => {
    return attendanceRecords.find(r => r.studentId === studentId)?.status;
  };

  const handleSubmit = () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: "Warning",
        description: "Please mark attendance for at least one student.",
        variant: "destructive",
      });
      return;
    }
    submitAttendanceMutation.mutate();
  };

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const totalStudents = students?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Take Attendance</CardTitle>
              {selectedClass && (
                <p className="text-gray-600 mt-1" data-testid="text-class-info">
                  {todayClasses?.find((c: any) => c.id === selectedClass)?.subject} - {new Date().toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600" data-testid="text-present-count">
                {presentCount}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger data-testid="select-class">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {todayClasses?.map((classItem: any) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.subject} ({classItem.startTime} - {classItem.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Method Toggle */}
          {selectedClass && (
            <Tabs value={attendanceMethod} onValueChange={(value) => setAttendanceMethod(value as 'tap' | 'qr')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tap" data-testid="tab-tap-method">
                  <i className="fas fa-hand-paper mr-2"></i>
                  Tap Method
                </TabsTrigger>
                <TabsTrigger value="qr" data-testid="tab-qr-method">
                  <i className="fas fa-qrcode mr-2"></i>
                  QR Scan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tap" className="mt-6">
                {studentsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students?.map((student) => {
                      const status = getStudentStatus(student.id);
                      const isMarked = !!status;
                      
                      return (
                        <Card 
                          key={student.id} 
                          className={`${
                            status === 'present' ? 'bg-green-50 border-green-200' :
                            status === 'absent' ? 'bg-red-50 border-red-200' :
                            status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                            'border-gray-200'
                          }`}
                          data-testid={`card-student-${student.id}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                                  <i className="fas fa-user text-gray-600 text-sm"></i>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900" data-testid={`text-student-name-${student.id}`}>
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500" data-testid={`text-roll-number-${student.id}`}>
                                    Roll: {student.rollNumber}
                                  </p>
                                </div>
                              </div>
                              
                              {isMarked ? (
                                <div className="flex items-center space-x-1">
                                  <Badge 
                                    className={
                                      status === 'present' ? 'bg-green-100 text-green-800' :
                                      status === 'absent' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }
                                    data-testid={`badge-status-${student.id}`}
                                  >
                                    {status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => undoMark(student.id)}
                                    className="w-6 h-6 p-0"
                                    data-testid={`button-undo-${student.id}`}
                                  >
                                    <i className="fas fa-undo text-xs"></i>
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                                    onClick={() => markAttendance(student.id, 'present')}
                                    data-testid={`button-present-${student.id}`}
                                  >
                                    <i className="fas fa-check text-xs"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-red-600 hover:bg-red-700"
                                    onClick={() => markAttendance(student.id, 'absent')}
                                    data-testid={`button-absent-${student.id}`}
                                  >
                                    <i className="fas fa-times text-xs"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-yellow-600 hover:bg-yellow-700"
                                    onClick={() => markAttendance(student.id, 'late')}
                                    data-testid={`button-late-${student.id}`}
                                  >
                                    <i className="fas fa-clock text-xs"></i>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="qr" className="mt-6">
                <Card className="text-center py-12">
                  <CardContent>
                    <i className="fas fa-qrcode text-6xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Scanner</h3>
                    <p className="text-gray-600 mb-4">
                      Position student ID cards in front of your camera to scan
                    </p>
                    <Button data-testid="button-start-camera">
                      <i className="fas fa-camera mr-2"></i>
                      Start Camera
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {selectedClass && students && students.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600" data-testid="text-progress">
                <span>{attendanceRecords.length}</span> of <span>{totalStudents}</span> students marked
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  disabled={attendanceRecords.length === 0}
                  data-testid="button-save-draft"
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={attendanceRecords.length === 0 || submitAttendanceMutation.isPending}
                  data-testid="button-submit-attendance"
                >
                  {submitAttendanceMutation.isPending ? 'Submitting...' : 'Submit Attendance'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
