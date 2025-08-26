import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Megaphone,
  BookOpen as BookIcon
} from "lucide-react";

interface Student {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  classLevels: string[];
  parentId: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
}

interface Grade {
  id: string;
  score: number;
  maxScore: number;
  assessmentName: string;
  subjectName: string;
  gradedAt: string;
  feedback?: string;
}

interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'late';
  subjectName: string;
  classTime: string;
}

interface EnrolledSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  teacherEmail: string;
  baseFee: string;
  isActive: boolean;
}

interface StudentPortalProps {
  studentId?: string;
}

interface ScheduleNotification {
  id: string;
  message: string;
  status: 'pending' | 'read';
  createdAt: string;
  affectedDate: string;
  changeType: 'cancellation' | 'reschedule' | 'extra_class';
  subjectName: string;
}

interface ScheduleItem {
  id: string;
  type: 'regular' | 'cancellation' | 'reschedule' | 'extra_class';
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  location?: string;
  teacherName: string;
  affectedDate?: string;
  reason?: string;
}

export default function StudentPortal(props: StudentPortalProps = {}) {
  const { studentId: urlStudentId } = useParams<{ studentId: string }>();
  const studentId = props.studentId || urlStudentId;
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Fetch student announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ["/api/students", studentId, "announcements"],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/announcements`);
      return response.json();
    },
    enabled: !!studentId,
  });

  // Fetch student schedule
  const { data: schedule } = useQuery({
    queryKey: ["/api/student", studentId, "schedule"],
    queryFn: async () => {
      const response = await fetch(`/api/student/${studentId}/schedule`);
      return response.ok ? response.json() : { regularSchedules: [], scheduleChanges: [] };
    },
    enabled: !!studentId,
  });

  // Fetch schedule notifications
  const { data: notifications = [] } = useQuery<ScheduleNotification[]>({
    queryKey: ["/api/student", studentId, "notifications"],
    queryFn: async () => {
      const response = await fetch(`/api/student/${studentId}/notifications`);
      return response.ok ? response.json() : [];
    },
    enabled: !!studentId,
  });

  // Fetch student basic information
  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch enrolled subjects with teacher info
  const { data: enrolledSubjects, isLoading: subjectsLoading } = useQuery<EnrolledSubject[]>({
    queryKey: [`/api/students/${studentId}/enrolled-subjects`],
    enabled: !!studentId,
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/enrolled-subjects`);
      return response.ok ? response.json() : [];
    }
  });

  // Fetch student grades (either all or for specific subject)
  const { data: grades, isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: [`/api/students/${studentId}/grades`, selectedSubjectId],
    enabled: !!studentId,
    queryFn: async () => {
      const url = selectedSubjectId === 'all' 
        ? `/api/students/${studentId}/grades`
        : `/api/students/${studentId}/grades/${selectedSubjectId}`;
      const response = await fetch(url);
      return response.ok ? response.json() : [];
    }
  });

  // Fetch student attendance (either all or for specific subject)
  const { data: attendance, isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/students/${studentId}/attendance`, selectedSubjectId],
    enabled: !!studentId,
    queryFn: async () => {
      const url = selectedSubjectId === 'all' 
        ? `/api/students/${studentId}/attendance`
        : `/api/students/${studentId}/attendance/${selectedSubjectId}`;
      const response = await fetch(url);
      return response.ok ? response.json() : [];
    }
  });

  // Calculate attendance statistics
  const attendanceArray = Array.isArray(attendance) ? attendance : [];
  const attendanceStats = {
    total: attendanceArray.length,
    present: attendanceArray.filter((a: any) => a.status === 'present').length,
    late: attendanceArray.filter((a: any) => a.status === 'late').length,
    absent: attendanceArray.filter((a: any) => a.status === 'absent').length,
  };

  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  // Get current selected subject info
  const currentSubject = selectedSubjectId === 'all' 
    ? null 
    : enrolledSubjects?.find(s => s.subjectId === selectedSubjectId);

  // Mock subjects with progress for design consistency
  const subjectProgress = [
    { name: 'Physics', assessment: 'Final Term Exam', score: 84, maxScore: 100, trend: 'up' },
    { name: 'Mathematics', assessment: 'Monthly Test', score: 78, maxScore: 100, trend: 'up' },
    { name: 'Chemistry', assessment: 'Quiz - Organic', score: 44, maxScore: 50, trend: 'stable' },
    { name: 'English', assessment: 'Essay Writing', score: 36, maxScore: 40, trend: 'up' },
    { name: 'Biology', assessment: 'Lab Test', score: 35, maxScore: 40, trend: 'down' }
  ];

  if (studentLoading || subjectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student information...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600">The requested student information could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section - Purple Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl text-white p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {student.profileImageUrl ? (
                  <img 
                    src={student.profileImageUrl} 
                    alt={`${student.firstName} ${student.lastName}`}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex items-center space-x-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>ID: {student.rollNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Class: {student.classLevels && student.classLevels.length > 0 ? student.classLevels.map(level => level.toUpperCase()).join(', ') : 'No Class'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Academic Year: 2023-24</span>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">HONORS STUDENT</Badge>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">EXCELLENT ATTENDANCE</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Selector and Teacher Info */}
        <div className="mb-6 space-y-4">
          {/* Subject Selector */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Subject View</h3>
                  <p className="text-sm text-gray-500">Select a subject to view specific grades and attendance</p>
                </div>
              </div>
              <div className="min-w-[250px]">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📊 All Subjects Overview</SelectItem>
                    {enrolledSubjects?.map((subject) => (
                      <SelectItem key={subject.subjectId} value={subject.subjectId}>
                        📚 {subject.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Teacher Contact Info - Only show when specific subject is selected */}
          {currentSubject && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {currentSubject.subjectName} Teacher
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="h-4 w-4" />
                      <span>{currentSubject.teacherFirstName} {currentSubject.teacherLastName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Mail className="h-4 w-4" />
                      <a 
                        href={`mailto:${currentSubject.teacherEmail}`}
                        className="text-purple-600 hover:text-purple-800 underline"
                      >
                        {currentSubject.teacherEmail}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <DollarSign className="h-4 w-4" />
                      <span>Subject Fee: Rs. {currentSubject.baseFee}/month</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-1">OVERALL GRADE</p>
                  <p className="text-2xl font-bold text-emerald-900">A-</p>
                  <p className="text-xs text-emerald-700">Class Average</p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-cyan-600 mb-1">ATTENDANCE</p>
                  <p className="text-2xl font-bold text-cyan-900">{attendancePercentage}%</p>
                  <p className="text-xs text-cyan-700">{attendanceStats.present} of {attendanceStats.total} Days</p>
                </div>
                <div className="bg-cyan-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-600 mb-1">FEES DUE</p>
                  <p className="text-2xl font-bold text-orange-900">Rs.8,000</p>
                  <p className="text-xs text-orange-700">Due August 30th, 2025</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-full">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-pink-600 mb-1">CLASS RANK</p>
                  <p className="text-2xl font-bold text-pink-900">7th</p>
                  <p className="text-xs text-pink-700">of 45 Students</p>
                </div>
                <div className="bg-pink-100 p-2 rounded-full">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Academic Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle>Academic Performance</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Recent assessments and subject-wise performance</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectProgress.map((subject, index) => {
                  const percentage = Math.round((subject.score / subject.maxScore) * 100);
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="font-medium text-gray-900">{subject.name}</p>
                            <p className="text-sm text-gray-600">{subject.assessment}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-bold text-gray-900">{subject.score}/{subject.maxScore}</p>
                            <p className="text-sm text-gray-600">{percentage}%</p>
                          </div>
                          {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {subject.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <CardTitle>Attendance Overview</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Monthly attendance summary and detailed log</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{attendanceStats.present || 23}</p>
                    <p className="text-sm text-green-700">PRESENT</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900">{attendanceStats.late || 1}</p>
                    <p className="text-sm text-yellow-700">LATE</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-900">{attendanceStats.absent || 1}</p>
                    <p className="text-sm text-red-700">ABSENT</p>
                  </div>
                </div>

                <h4 className="font-medium text-gray-700 mb-3">Recent Attendance Log</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { date: 'Oct 5, 2025', subject: 'Physics', status: 'Present' },
                    { date: 'Oct 4, 2025', subject: 'Physics', status: 'Late' },
                    { date: 'Oct 3, 2025', subject: 'Physics', status: 'Present' },
                    { date: 'Oct 2, 2025', subject: 'Physics', status: 'Absent' },
                    { date: 'Oct 1, 2025', subject: 'Physics', status: 'Present' }
                  ].map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{record.date}</p>
                        <p className="text-sm text-gray-600">{record.subject}</p>
                      </div>
                      <Badge 
                        className={
                          record.status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' :
                          record.status === 'Late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Fee Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  <CardTitle>Fee Status</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Payment overview and outstanding balance</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <p className="font-semibold text-orange-800">Outstanding Balance</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">Rs.8,000</p>
                  <p className="text-sm text-orange-700">Due: August 30th, 2025</p>
                  <p className="text-xs text-orange-600 mt-1">Invoice: INV001</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">INV001</p>
                        <p className="text-sm text-gray-600">Oct 05, 2025</p>
                      </div>
                      <p className="font-bold text-green-600">Rs.12,000</p>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">INV001</p>
                        <p className="text-sm text-gray-600">Sep 05, 2025</p>
                      </div>
                      <p className="font-bold text-green-600">Rs.16,000</p>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Pay Outstanding Balance
                </button>
              </CardContent>
            </Card>

            {/* Digital Diary - Announcements */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-purple-600" />
                  <CardTitle>Digital Diary</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Messages and announcements from your teachers</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(announcements) && announcements.length > 0 ? (
                  announcements.slice(0, 4).map((announcement: any) => {
                    const getAnnouncementStyle = (type: string, priority: string) => {
                      const styles = {
                        homework: "bg-orange-50 border-l-4 border-orange-500",
                        notice: "bg-blue-50 border-l-4 border-blue-500", 
                        reminder: "bg-yellow-50 border-l-4 border-yellow-500",
                        announcement: "bg-purple-50 border-l-4 border-purple-500"
                      };
                      return styles[type as keyof typeof styles] || styles.announcement;
                    };

                    const getAnnouncementTextColor = (type: string) => {
                      const colors = {
                        homework: "text-orange-900",
                        notice: "text-blue-900",
                        reminder: "text-yellow-900", 
                        announcement: "text-purple-900"
                      };
                      return colors[type as keyof typeof colors] || colors.announcement;
                    };

                    const getAnnouncementIcon = (type: string) => {
                      switch (type) {
                        case "homework": return <BookIcon className="h-4 w-4" />;
                        case "notice": return <AlertCircle className="h-4 w-4" />;
                        case "reminder": return <Clock className="h-4 w-4" />;
                        default: return <Megaphone className="h-4 w-4" />;
                      }
                    };

                    const getPriorityBadge = (priority: string) => {
                      const variants = {
                        high: "destructive",
                        medium: "secondary", 
                        low: "outline"
                      };
                      return variants[priority as keyof typeof variants] || "secondary";
                    };

                    return (
                      <div 
                        key={announcement.id} 
                        className={`p-3 rounded ${getAnnouncementStyle(announcement.type, announcement.priority)}`}
                        data-testid={`announcement-${announcement.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getAnnouncementIcon(announcement.type)}
                            <div>
                              <p className={`font-medium ${getAnnouncementTextColor(announcement.type)}`}>
                                {announcement.title}
                              </p>
                              <p className="text-xs text-gray-600 capitalize">
                                {announcement.type} • {announcement.teacherFirstName} {announcement.teacherLastName}
                                {announcement.subjectName && ` • ${announcement.subjectName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={getPriorityBadge(announcement.priority) as any} className="text-xs">
                              {announcement.priority}
                            </Badge>
                            {!announcement.isRead && (
                              <div className="w-2 h-2 bg-red-500 rounded-full" title="Unread"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          {announcement.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(announcement.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No announcements yet</p>
                    <p className="text-sm text-gray-400">Your teachers' messages will appear here</p>
                  </div>
                )}
                
                {Array.isArray(announcements) && announcements.length > 4 && (
                  <div className="text-center pt-2">
                    <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                      View All Announcements ({announcements.length})
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule & Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle>Class Schedule</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Your weekly class schedule and schedule updates</p>
              </CardHeader>
              <CardContent>
                {/* Schedule Notifications */}
                {notifications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Schedule Updates ({notifications.filter(n => n.status === 'pending').length} new)
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => {
                        const getNotificationIcon = (type: string) => {
                          switch (type) {
                            case "cancellation": return <XCircle className="h-4 w-4 text-red-500" />;
                            case "reschedule": return <Clock className="h-4 w-4 text-orange-500" />;
                            case "extra_class": return <Calendar className="h-4 w-4 text-green-500" />;
                            default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
                          }
                        };

                        const getBgColor = (type: string, status: string) => {
                          const opacity = status === 'read' ? '50' : '100';
                          switch (type) {
                            case "cancellation": return `bg-red-${opacity} border-red-200`;
                            case "reschedule": return `bg-orange-${opacity} border-orange-200`;
                            case "extra_class": return `bg-green-${opacity} border-green-200`;
                            default: return `bg-blue-${opacity} border-blue-200`;
                          }
                        };

                        return (
                          <div 
                            key={notification.id}
                            className={`p-3 rounded-lg border ${getBgColor(notification.changeType, notification.status)} ${notification.status === 'pending' ? 'border-l-4' : ''}`}
                            data-testid={`notification-${notification.id}`}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.changeType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {notification.subjectName}
                                  </p>
                                  {notification.status === 'pending' && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" title="New notification"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()} • 
                                  Affected: {new Date(notification.affectedDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weekly Schedule */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Weekly Class Schedule</h4>
                  {schedule?.regularSchedules?.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        const scheduleByDay: any = {};
                        
                        schedule.regularSchedules.forEach((item: any) => {
                          const day = dayNames[item.dayOfWeek];
                          if (!scheduleByDay[day]) {
                            scheduleByDay[day] = [];
                          }
                          scheduleByDay[day].push(item);
                        });

                        // Sort each day's classes by start time
                        Object.keys(scheduleByDay).forEach(day => {
                          scheduleByDay[day].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                        });

                        return dayNames.map(day => (
                          <div key={day} className="border rounded-lg p-3">
                            <h5 className="font-medium text-gray-800 mb-2">{day}</h5>
                            {scheduleByDay[day]?.length > 0 ? (
                              <div className="space-y-2">
                                {scheduleByDay[day].map((classItem: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm font-medium text-blue-600">
                                        {classItem.startTime} - {classItem.endTime}
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">{classItem.subjectName}</p>
                                        <p className="text-xs text-gray-600">
                                          {classItem.teacherName}
                                          {classItem.location && ` • ${classItem.location}`}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {classItem.subjectCode}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No classes scheduled</p>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No schedule available</p>
                      <p className="text-sm text-gray-400">Your class schedule will appear here once created by teachers</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <CardTitle>Contact Information</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Get in touch with school staff</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Class Teacher</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Ms. Sarah Johnson</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>sarah.johnson@primax.edu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>+92 XXX-XXX-XXXX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>Office: Room 204, Main Building</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                    <Mail className="h-4 w-4" />
                    Send Message to Teacher
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                    <Calendar className="h-4 w-4" />
                    Schedule Meeting
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}