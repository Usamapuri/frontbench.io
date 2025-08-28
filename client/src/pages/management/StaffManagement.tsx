import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Users, UserPlus, Mail, Phone, User } from "lucide-react";
import AddTeacherModal from "@/components/AddTeacherModal";
import AddStaffModal from "@/components/AddStaffModal";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function StaffManagement() {
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

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
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
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
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString()}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
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
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(staffMember.createdAt).toLocaleDateString()}
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
    </div>
  );
}