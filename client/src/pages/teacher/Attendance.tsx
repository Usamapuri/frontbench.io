import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Clock, QrCode, Users, Calendar } from "lucide-react";
import QrScanner from "qr-scanner";

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
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: todayClasses } = useQuery<any[]>({
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
      // Expected QR format: studentId:rollNumber or just studentId
      const studentId = qrData.includes(':') ? qrData.split(':')[0] : qrData;
      const student = students?.find(s => s.id === studentId || s.rollNumber === qrData);
      
      if (student) {
        // Auto-mark as present when QR is scanned
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

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const totalStudents = students?.length || 0;
  const unmarkedCount = totalStudents - attendanceRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Take Attendance
              </CardTitle>
              {selectedClass && (
                <p className="text-gray-600 mt-1 flex items-center gap-2" data-testid="text-class-info">
                  <Calendar className="h-4 w-4" />
                  {todayClasses?.find((c: any) => c.id === selectedClass)?.subject} - {new Date().toLocaleDateString()}
                </p>
              )}
            </div>
            {selectedClass && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-present-count">
                    {presentCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-absent-count">
                    {absentCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Late</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="text-late-count">
                    {lateCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Unmarked</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600" data-testid="text-unmarked-count">
                    {unmarkedCount}
                  </p>
                </div>
              </div>
            )}
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
            <Tabs value={attendanceMethod} onValueChange={(value) => setAttendanceMethod(value as 'tap' | 'qr')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tap" className="flex items-center gap-2" data-testid="tab-tap-method">
                  <Users className="h-4 w-4" />
                  Tap Interface
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2" data-testid="tab-qr-method">
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
                          data-testid={`card-student-${student.id}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center text-xs font-bold text-gray-700">
                                  {student.rollNumber}
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
                          data-testid="button-toggle-scanner"
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
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">QR Code Format</h4>
                        <p className="text-sm text-blue-700">
                          Expected format: <code className="bg-blue-100 px-1 rounded">studentId:rollNumber</code> or just <code className="bg-blue-100 px-1 rounded">studentId</code>
                        </p>
                      </div>
                    </div>
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
