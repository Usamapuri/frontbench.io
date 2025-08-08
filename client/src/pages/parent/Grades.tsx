import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Grade, Student, Assessment } from "@shared/schema";

export default function Grades() {
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: children } = useQuery<Student[]>({
    queryKey: ['/api/students'], // In real implementation, filter by parent ID
  });

  const { data: grades } = useQuery<Grade[]>({
    queryKey: ['/api/grades/student', selectedChild],
    enabled: !!selectedChild,
  });

  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const selectedChildData = children?.find(child => child.id === selectedChild);

  // Group grades by subject for better organization
  const gradesBySubject = grades?.reduce((acc, grade) => {
    const subjectId = grade.assessmentId; // This would be properly linked in real implementation
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>) || {};

  const calculateSubjectAverage = (subjectGrades: Grade[]) => {
    if (subjectGrades.length === 0) return 0;
    const total = subjectGrades.reduce((sum, grade) => sum + grade.marksObtained, 0);
    return total / subjectGrades.length;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recentGrades = grades?.slice(0, 10) || [];

  // Mock subject data for demonstration
  const mockSubjects = [
    { id: 'chemistry', name: 'Chemistry', average: 92, trend: 'up', lastGrade: 'A+' },
    { id: 'physics', name: 'Physics', average: 89, trend: 'stable', lastGrade: 'A' },
    { id: 'mathematics', name: 'Mathematics', average: 85, trend: 'up', lastGrade: 'B+' },
    { id: 'biology', name: 'Biology', average: 94, trend: 'up', lastGrade: 'A+' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Academic Performance</CardTitle>
            <div className="flex space-x-3">
              {children && children.length > 1 && (
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-48" data-testid="select-child">
                    <SelectValue placeholder="Select child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40" data-testid="select-subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedChild && children && children.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <i className="fas fa-graduation-cap text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
              <p className="text-gray-600">
                Choose a child from the dropdown above to view their grades and performance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Grades</TabsTrigger>
            <TabsTrigger value="progress">Progress Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overall Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance - {selectedChildData?.firstName} {selectedChildData?.lastName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600" data-testid="overall-average">89.5</p>
                    <p className="text-sm text-gray-600">Overall Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600" data-testid="current-rank">3</p>
                    <p className="text-sm text-gray-600">Class Rank</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600" data-testid="subjects-count">4</p>
                    <p className="text-sm text-gray-600">Subjects</p>
                  </div>
                  <div className="text-center">
                    <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800" data-testid="overall-grade">
                      A
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Overall Grade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`subject-${subject.id}`}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-book text-blue-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-sm text-gray-600">Average: {subject.average}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getGradeColor(subject.lastGrade)} data-testid={`grade-${subject.id}`}>
                          {subject.lastGrade}
                        </Badge>
                        <div className="flex items-center mt-1">
                          <i className={`fas fa-arrow-${subject.trend === 'up' ? 'up' : subject.trend === 'down' ? 'down' : 'right'} text-${subject.trend === 'up' ? 'green' : subject.trend === 'down' ? 'red' : 'gray'}-500 text-xs mr-1`}></i>
                          <span className="text-xs text-gray-500">{subject.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentGrades.length > 0 ? recentGrades.map((grade, index) => (
                    <div key={grade.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg" data-testid={`recent-grade-${index}`}>
                      <div>
                        <p className="font-medium text-gray-900">Assessment Name</p>
                        <p className="text-sm text-gray-600">Subject Name</p>
                        <p className="text-xs text-gray-500">{new Date(grade.enteredAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{grade.marksObtained}/100</p>
                        <Badge className={getGradeColor(grade.grade || 'B')} data-testid={`badge-grade-${index}`}>
                          {grade.grade || 'B'}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-clipboard-list text-4xl mb-4"></i>
                      <p>No recent grades available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {/* Detailed Grades Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Grade Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Subject</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Assessment</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Marks</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Grade</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentGrades.length > 0 ? recentGrades.map((grade, index) => (
                        <tr key={grade.id} className="hover:bg-gray-50" data-testid={`detailed-grade-${index}`}>
                          <td className="px-4 py-3" data-testid={`date-${index}`}>
                            {new Date(grade.enteredAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">Subject Name</td>
                          <td className="px-4 py-3">Assessment Name</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">{grade.marksObtained}/100</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getGradeColor(grade.grade || 'B')}>
                              {grade.grade || 'B'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {grade.comments || 'Good work!'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No detailed grades available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSubjects.map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{subject.name}</span>
                          <span className="text-sm text-gray-600">{subject.average}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${subject.average}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">March 2024</span>
                      <div className="text-right">
                        <p className="font-semibold text-green-800">92%</p>
                        <p className="text-xs text-green-600">Excellent</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">February 2024</span>
                      <div className="text-right">
                        <p className="font-semibold text-blue-800">89%</p>
                        <p className="text-xs text-blue-600">Very Good</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-800">January 2024</span>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-800">87%</p>
                        <p className="text-xs text-yellow-600">Good</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teacher Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="font-medium text-green-800">Chemistry - Ms. Ayesha</p>
                    <p className="text-sm text-gray-600">
                      "Excellent understanding of organic chemistry concepts. Shows great improvement in lab work."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">March 15, 2024</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-blue-800">Physics - Mr. Ahmed</p>
                    <p className="text-sm text-gray-600">
                      "Good grasp of mechanics principles. Needs to focus more on problem-solving techniques."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">March 12, 2024</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <p className="font-medium text-purple-800">Mathematics - Mr. Hassan</p>
                    <p className="text-sm text-gray-600">
                      "Consistent performance in calculus. Excellent work on the recent assignment."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">March 10, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
