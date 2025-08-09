import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Clock, QrCode, Users, Calendar, School, ChevronRight } from "lucide-react";
import QrScanner from "qr-scanner";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  profileImageUrl?: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  teacherName: string;
  teacherId: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export default function AttendanceManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceMethod, setAttendanceMethod] = useState<'tap' | 'qr'>('tap');
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch all classes for the selected date
  const { data: allClasses, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes/all', selectedDate],
    queryFn: async () => {
      // This would need to be implemented on the backend
      const response = await fetch(`/api/classes/all?date=${selectedDate}`);
      return response.ok ? response.json() : [];
    }
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/classes', selectedClass, 'students'],
    enabled: !!selectedClass,
  });

  // Get existing attendance for the selected class and date
  const { data: existingAttendance } = useQuery({
    queryKey: ['/api/attendance', selectedClass, selectedDate],
    enabled: !!selectedClass,
    queryFn: async () => {
      const response = await fetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`);
      return response.ok ? response.json() : [];
    }
  });

  // Update attendance records when existing attendance is loaded
  useEffect(() => {
    if (existingAttendance) {
      const records = existingAttendance.map((att: any) => ({
        studentId: att.studentId,
        status: att.status
      }));
      setAttendanceRecords(records);
    }
  }, [existingAttendance]);

  // Check if attendance has been taken for a class
  const getClassAttendanceStatus = (classId: string) => {
    if (classId === selectedClass && existingAttendance && existingAttendance.length > 0) {
      return 'taken';
    }
    return 'not-taken';
  };

  const submitAttendanceMutation = useMutation({
    mutationFn: async () => {
      const promises = attendanceRecords.map(record => 
        apiRequest('POST', '/api/attendance', {
          classId: selectedClass,
          studentId: record.studentId,
          attendanceDate: selectedDate,
          status: record.status,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  // QR Scanner setup
  useEffect(() => {
    if (attendanceMethod === 'qr' && videoRef.current && !qrScanner && isScanning) {
      const scanner = new QrScanner(
        videoRef.current,
        (result: QrScanner.ScanResult) => handleQrScan(result.data),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      setQrScanner(scanner);
      scanner.start();
    }

    return () => {
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
        setQrScanner(null);
      }
    };
  }, [attendanceMethod, isScanning]);

  const handleQrScan = (qrData: string) => {
    try {
      const studentId = qrData.includes(':') ? qrData.split(':')[0] : qrData;
      const student = students?.find(s => s.id === studentId || s.rollNumber === qrData);
      
      if (student) {
        markAttendance(student.id, 'present');
        toast({
          title: "Student Scanned",
          description: `${student.firstName} ${student.lastName} marked as present`,
        });
      } else {
        toast({
          title: "Student Not Found",
          description: "This QR code doesn't match any student in the current class",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Unable to read student information from this QR code",
        variant: "destructive",
      });
    }
  };

  const toggleScanning = () => {
    if (isScanning && qrScanner) {
      qrScanner.stop();
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  };

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
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first.",
        variant: "destructive",
      });
      return;
    }
    submitAttendanceMutation.mutate();
  };

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const totalStudents = students?.length || 0;
  const unmarkedCount = totalStudents - attendanceRecords.length;

  // Group classes by teacher
  const classesByTeacher = allClasses?.reduce((acc, cls) => {
    if (!acc[cls.teacherId]) {
      acc[cls.teacherId] = {
        teacherName: cls.teacherName,
        classes: []
      };
    }
    acc[cls.teacherId].classes.push(cls);
    return acc;
  }, {} as Record<string, { teacherName: string; classes: Class[] }>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Attendance
                <span className="text-sm font-normal text-gray-500">(Front Desk)</span>
              </CardTitle>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Manage attendance for all classes and teachers
              </p>
            </div>
            {selectedClass && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {presentCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {absentCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Late</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {lateCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Unmarked</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">
                    {unmarkedCount}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-date"
              />
            </div>
          </div>

          {/* Classes by Teacher */}
          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(classesByTeacher).map(([teacherId, { teacherName, classes }]) => (
                <div key={teacherId}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {teacherName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((classItem) => (
                      <Card 
                        key={classItem.id}
                        className={`cursor-pointer transition-all ${
                          selectedClass === classItem.id 
                            ? 'bg-blue-50 border-blue-500 shadow-md' 
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          setSelectedClass(classItem.id);
                          setAttendanceRecords([]);
                        }}
                        data-testid={`card-class-${classItem.id}`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{classItem.subject}</h4>
                                {/* Show attendance status */}
                                {existingAttendance && existingAttendance.length > 0 && selectedClass === classItem.id && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    ✓ Taken
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {classItem.startTime} - {classItem.endTime}
                              </p>
                              <p className="text-xs text-gray-500">
                                {classItem.name}
                              </p>
                            </div>
                            <ChevronRight 
                              className={`h-5 w-5 ${
                                selectedClass === classItem.id ? 'text-blue-500' : 'text-gray-400'
                              }`} 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(classesByTeacher).length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
                  <p className="text-gray-600">
                    No classes are scheduled for {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Interface */}
          {selectedClass && (
            <Tabs value={attendanceMethod} onValueChange={(value) => setAttendanceMethod(value as 'tap' | 'qr')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tap" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tap Interface
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Scanner
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
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center text-xs font-bold text-gray-700">
                                  {student.rollNumber}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
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
                                  >
                                    {status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => undoMark(student.id)}
                                    className="w-6 h-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                                    onClick={() => markAttendance(student.id, 'present')}
                                    title="Mark as Present"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-red-600 hover:bg-red-700"
                                    onClick={() => markAttendance(student.id, 'absent')}
                                    title="Mark as Absent"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="w-8 h-8 p-0 bg-yellow-600 hover:bg-yellow-700"
                                    onClick={() => markAttendance(student.id, 'late')}
                                    title="Mark as Late"
                                  >
                                    <Clock className="h-3 w-3" />
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
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Scanner</h3>
                      <p className="text-gray-600 mb-4">
                        Scan student QR codes to automatically mark attendance as present
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Button 
                          onClick={toggleScanning}
                          className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                          {isScanning ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Stop Scanner
                            </>
                          ) : (
                            <>
                              <QrCode className="h-4 w-4 mr-2" />
                              Start Scanner
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {isScanning && (
                        <div className="relative">
                          <video 
                            ref={videoRef}
                            className="w-full max-w-md mx-auto rounded-lg border-2 border-dashed border-gray-300"
                            style={{ aspectRatio: '1/1' }}
                          />
                          <div className="text-center mt-2">
                            <p className="text-sm text-gray-600">
                              Hold student QR codes within the camera view
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={submitAttendanceMutation.isPending || attendanceRecords.length === 0}
                  className="min-w-[200px]"
                >
                  {submitAttendanceMutation.isPending ? 'Updating...' : 'Update Attendance'}
                </Button>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}