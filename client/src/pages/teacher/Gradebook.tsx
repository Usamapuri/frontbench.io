import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment, Grade } from "@shared/schema";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

export default function Gradebook() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [dialogSubject, setDialogSubject] = useState("");
  const [newAssessment, setNewAssessment] = useState({
    name: "",
    totalMarks: "",
    date: "",
    description: "",
  });
  const [grades, setGrades] = useState<{ [studentId: string]: { marks: string; comments: string } }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments'],
    enabled: !!selectedSubject,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      return await apiRequest('POST', '/api/assessments', assessmentData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setNewAssessment({ name: "", totalMarks: "", date: "", description: "" });
      setDialogSubject("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createGradesMutation = useMutation({
    mutationFn: async (gradesData: any[]) => {
      const promises = gradesData.map(grade => 
        apiRequest('POST', '/api/grades', grade)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grades submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      setGrades({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit grades. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateAssessment = () => {
    console.log('Validation Debug:', {
      name: newAssessment.name,
      totalMarks: newAssessment.totalMarks,
      dialogSubject: dialogSubject,
      selectedSubject: selectedSubject,
      date: newAssessment.date
    });
    
    // Check if required fields are filled
    const missingFields = [];
    if (!newAssessment.name?.trim()) missingFields.push('Assessment Name');
    if (!newAssessment.totalMarks?.trim()) missingFields.push('Total Marks');
    if (!dialogSubject && !selectedSubject) missingFields.push('Subject');
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields);
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Use dialogSubject if available, otherwise fall back to selectedSubject
    const subjectToUse = dialogSubject || selectedSubject;
    
    console.log('Creating assessment with data:', {
      name: newAssessment.name,
      subjectId: subjectToUse,
      totalMarks: parseInt(newAssessment.totalMarks),
      assessmentDate: newAssessment.date,
      description: newAssessment.description,
    });

    createAssessmentMutation.mutate({
      name: newAssessment.name,
      subjectId: subjectToUse,
      totalMarks: parseInt(newAssessment.totalMarks),
      assessmentDate: newAssessment.date,
      description: newAssessment.description,
    });
  };

  const handleGradeChange = (studentId: string, field: 'marks' | 'comments', value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const calculateGrade = (marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const handleSubmitGrades = () => {
    const gradesData = Object.entries(grades)
      .filter(([_, data]) => data.marks.trim() !== '')
      .map(([studentId, data]) => ({
        assessmentId: selectedAssessment,
        studentId,
        marksObtained: parseInt(data.marks),
        grade: calculateGrade(parseInt(data.marks), parseInt(newAssessment.totalMarks)),
        comments: data.comments,
      }));

    if (gradesData.length === 0) {
      toast({
        title: "Warning",
        description: "Please enter grades for at least one student.",
        variant: "destructive",
      });
      return;
    }

    createGradesMutation.mutate(gradesData);
  };

  const selectedAssessmentData = assessments?.find(a => a.id === selectedAssessment);

  return (
    <div className="space-y-6">
      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Gradebook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Select Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger data-testid="select-subject">
                <SelectValue placeholder="Choose a subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <Label htmlFor="assessment">Select Assessment</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger className="w-64" data-testid="select-assessment">
                  <SelectValue placeholder="Choose an assessment..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubject && assessments?.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name} ({assessment.totalMarks} marks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-create-assessment">
                  <i className="fas fa-plus mr-2"></i>
                  Create Assessment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assessment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assessmentSubject">Subject *</Label>
                    <Select 
                      value={dialogSubject} 
                      onValueChange={(value) => {
                        console.log('Subject selected:', value);
                        setDialogSubject(value);
                      }}
                    >
                      <SelectTrigger data-testid="select-assessment-subject">
                        <SelectValue placeholder="Choose a subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject: any) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assessmentName">Assessment Name *</Label>
                    <Input
                      id="assessmentName"
                      placeholder="e.g., Quiz 1, Midterm Exam"
                      value={newAssessment.name}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-assessment-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="totalMarks">Total Marks *</Label>
                    <Input
                      id="totalMarks"
                      type="number"
                      placeholder="100"
                      value={newAssessment.totalMarks}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, totalMarks: e.target.value }))}
                      data-testid="input-total-marks"
                    />
                  </div>

                  <div>
                    <Label htmlFor="assessmentDate">Assessment Date</Label>
                    <Input
                      id="assessmentDate"
                      type="date"
                      value={newAssessment.date}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, date: e.target.value }))}
                      data-testid="input-assessment-date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description..."
                      value={newAssessment.description}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="textarea-description"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button 
                      onClick={handleCreateAssessment}
                      disabled={createAssessmentMutation.isPending}
                      data-testid="button-save-assessment"
                    >
                      {createAssessmentMutation.isPending ? 'Creating...' : 'Create Assessment'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry */}
      {selectedAssessment && selectedAssessmentData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAssessmentData.name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Total Marks: {selectedAssessmentData.totalMarks} | 
                  Date: {new Date(selectedAssessmentData.assessmentDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" data-testid="button-import-csv">
                  <i className="fas fa-upload mr-2"></i>
                  Import CSV
                </Button>
                <Button variant="outline" data-testid="button-export-grades">
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Roll Number</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Marks Obtained</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students?.map((student) => {
                    const studentGrade = grades[student.id];
                    const marks = studentGrade?.marks ? parseInt(studentGrade.marks) : 0;
                    const grade = marks > 0 ? calculateGrade(marks, selectedAssessmentData.totalMarks) : '';
                    
                    return (
                      <tr key={student.id} data-testid={`row-student-${student.id}`}>
                        <td className="px-4 py-3">
                          <span className="font-medium" data-testid={`text-student-name-${student.id}`}>
                            {student.firstName} {student.lastName}
                          </span>
                        </td>
                        <td className="px-4 py-3" data-testid={`text-roll-number-${student.id}`}>
                          {student.rollNumber}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max={selectedAssessmentData.totalMarks}
                            value={studentGrade?.marks || ''}
                            onChange={(e) => handleGradeChange(student.id, 'marks', e.target.value)}
                            className="w-20"
                            data-testid={`input-marks-${student.id}`}
                          />
                          <span className="text-xs text-gray-500 ml-2">
                            / {selectedAssessmentData.totalMarks}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                              grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              grade === 'F' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                            data-testid={`badge-grade-${student.id}`}
                          >
                            {grade || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            placeholder="Optional comments..."
                            value={studentGrade?.comments || ''}
                            onChange={(e) => handleGradeChange(student.id, 'comments', e.target.value)}
                            className="w-48"
                            data-testid={`input-comments-${student.id}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                <span data-testid="text-graded-count">
                  {Object.values(grades).filter(g => g.marks.trim() !== '').length}
                </span> of <span>{students?.length || 0}</span> students graded
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" data-testid="button-save-draft">
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleSubmitGrades}
                  disabled={createGradesMutation.isPending}
                  data-testid="button-submit-grades"
                >
                  {createGradesMutation.isPending ? 'Submitting...' : 'Submit Grades'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {selectedAssessment && Object.keys(grades).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600" data-testid="text-class-average">
                  {(() => {
                    const validGrades = Object.values(grades).filter(g => g.marks.trim() !== '');
                    const average = validGrades.length > 0 
                      ? validGrades.reduce((sum, g) => sum + parseInt(g.marks), 0) / validGrades.length 
                      : 0;
                    return average.toFixed(1);
                  })()}%
                </p>
                <p className="text-sm text-gray-600">Class Average</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="text-highest-score">
                  {(() => {
                    const validMarks = Object.values(grades)
                      .filter(g => g.marks.trim() !== '')
                      .map(g => parseInt(g.marks));
                    return validMarks.length > 0 ? Math.max(...validMarks) : 0;
                  })()}
                </p>
                <p className="text-sm text-gray-600">Highest Score</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600" data-testid="text-lowest-score">
                  {(() => {
                    const validMarks = Object.values(grades)
                      .filter(g => g.marks.trim() !== '')
                      .map(g => parseInt(g.marks));
                    return validMarks.length > 0 ? Math.min(...validMarks) : 0;
                  })()}
                </p>
                <p className="text-sm text-gray-600">Lowest Score</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600" data-testid="text-pass-rate">
                  {(() => {
                    const validGrades = Object.values(grades).filter(g => g.marks.trim() !== '');
                    const passed = validGrades.filter(g => parseInt(g.marks) >= (selectedAssessmentData?.totalMarks || 100) * 0.5);
                    const passRate = validGrades.length > 0 ? (passed.length / validGrades.length) * 100 : 0;
                    return passRate.toFixed(0);
                  })()}%
                </p>
                <p className="text-sm text-gray-600">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
