import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus, Mail, Phone, User, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddTeacherModal from "@/components/AddTeacherModal";
import AddStaffModal from "@/components/AddStaffModal";
import EditTeacherModal from "@/components/EditTeacherModal";
import EditStaffModal from "@/components/EditStaffModal";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  teacherSubjects?: string[];
  hireDate?: string;
}

export default function StaffManagement() {
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [editTeacherModalOpen, setEditTeacherModalOpen] = useState(false);
  const [editStaffModalOpen, setEditStaffModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch subjects to map IDs to names
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
  });

  // Helper function to get subject names from IDs
  const getSubjectNames = (subjectIds: string[] = []) => {
    if (!subjects || !Array.isArray(subjects) || !subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) return 'None';
    const subjectNames = subjectIds
      .map(id => subjects.find((s: any) => s.id === id)?.name)
      .filter(Boolean);
    return subjectNames.length > 0 ? subjectNames.join(', ') : 'None';
  };

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await apiRequest('DELETE', `/api/teachers/${teacherId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return await apiRequest('DELETE', `/api/staff/${staffId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleEditTeacher = (teacher: Staff) => {
    setSelectedTeacher(teacher);
    setEditTeacherModalOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditStaffModalOpen(true);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    deleteTeacherMutation.mutate(teacherId);
  };

  const handleDeleteStaff = (staffId: string) => {
    deleteStaffMutation.mutate(staffId);
  };

  const activeTeachers = staff?.filter(s => s.role === 'teacher' && s.isActive) || [];
  const activeStaff = staff?.filter(s => s.role !== 'teacher' && s.isActive) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage teachers and administrative staff</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {activeTeachers.length} Teachers
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {activeStaff.length} Staff
          </Badge>
        </div>
      </div>

      {/* Add Staff Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Staff</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Add new teachers or administrative staff to the system
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button 
              onClick={() => setAddTeacherModalOpen(true)}
              variant="outline" 
              className="w-full h-32 flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              data-testid="button-add-teacher"
            >
              <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <span className="text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors block">
                  Add New Teacher
                </span>
                <span className="text-sm text-gray-500">
                  Teaching staff with subject assignments
                </span>
              </div>
            </Button>
            
            <Button 
              onClick={() => setAddStaffModalOpen(true)}
              variant="outline" 
              className="w-full h-32 flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-green-300 transition-all duration-200 group"
              data-testid="button-add-staff"
            >
              <div className="p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <span className="text-lg font-medium text-gray-700 group-hover:text-green-600 transition-colors block">
                  Add Finance/Front-Desk Staff
                </span>
                <span className="text-sm text-gray-500">
                  Administrative and support staff
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teachers
            </CardTitle>
            <Badge variant="outline" className="px-3 py-1">
              {activeTeachers.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeTeachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Teachers Added</h3>
              <p className="text-sm mb-4">Add your first teacher to get started</p>
              <Button onClick={() => setAddTeacherModalOpen(true)} data-testid="button-add-first-teacher">
                Add Teacher
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Hired</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {teacher.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {teacher.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {teacher.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {getSubjectNames(teacher.teacherSubjects)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTeacher(teacher)}
                          data-testid={`button-edit-teacher-${teacher.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-teacher-${teacher.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {teacher.name}? This action cannot be undone and will remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Administrative Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Administrative Staff
            </CardTitle>
            <Badge variant="outline" className="px-3 py-1">
              {activeStaff.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Administrative Staff Added</h3>
              <p className="text-sm mb-4">Add finance or front-desk staff to manage operations</p>
              <Button onClick={() => setAddStaffModalOpen(true)} data-testid="button-add-first-staff">
                Add Staff
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Hired</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStaff.map((staffMember) => (
                  <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {staffMember.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {staffMember.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {staffMember.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {staffMember.hireDate ? new Date(staffMember.hireDate).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStaff(staffMember)}
                          data-testid={`button-edit-staff-${staffMember.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-staff-${staffMember.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {staffMember.name}? This action cannot be undone and will remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStaff(staffMember.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Teacher Modal */}
      <AddTeacherModal 
        open={addTeacherModalOpen} 
        onOpenChange={setAddTeacherModalOpen} 
      />

      {/* Add Staff Modal */}
      <AddStaffModal 
        open={addStaffModalOpen} 
        onOpenChange={setAddStaffModalOpen} 
      />

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        open={editTeacherModalOpen}
        onOpenChange={setEditTeacherModalOpen}
        teacher={selectedTeacher}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        open={editStaffModalOpen}
        onOpenChange={setEditStaffModalOpen}
        staff={selectedStaff}
      />
    </div>
  );
}