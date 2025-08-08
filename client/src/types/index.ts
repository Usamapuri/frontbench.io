export interface DashboardStats {
  totalStudents: number;
  monthlyRevenue: number;
  pendingFees: number;
  avgAttendance: number;
}

export interface TeacherEarnings {
  baseAmount: number;
  extraClasses: number;
  total: number;
}

export interface StudentWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  classLevel: string;
  outstandingFees: number;
  attendance: number;
  avgGrade: string;
  profileImageUrl?: string;
}

export interface ClassSchedule {
  id: string;
  name: string;
  subject: string;
  startTime: string;
  endTime: string;
  status?: 'completed' | 'in-progress' | 'upcoming';
  attendanceCount?: {
    present: number;
    total: number;
  };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  classId: string;
}

export interface Transaction {
  id: string;
  studentName: string;
  description: string;
  amount: number;
  time: string;
  type: 'payment' | 'fee' | 'enrollment';
}

export interface CashDrawRequest {
  id: string;
  teacherName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}
