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
  const [dialogSubject, setDialogSubject] = useState("");
  const [newAssessment, setNewAssessment] = useState({
    name: "",
    totalMarks: "",
    date: "",
    description: "",
  });
  const [grades, setGrades] = useState<{ [studentId: string]: { marks: string; comments: string } }>({});
  const [selectedAssessmentForGrading, setSelectedAssessmentForGrading] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch only teacher's assigned subjects (maintaining data isolation)
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/teacher/subjects'],
  });

  // Fetch only teacher's students (enrolled in subjects they teach)
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/teacher/students'],
  });

  // Fetch only teacher's assessments (maintaining data isolation)
  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: ['/api/teacher/assessments'],
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
      date: newAssessment.date
    });
    
    // Check if required fields are filled
    const missingFields = [];
    if (!newAssessment.name?.trim()) missingFields.push('Assessment Name');
    if (!newAssessment.totalMarks?.trim()) missingFields.push('Total Marks');
    if (!dialogSubject) missingFields.push('Subject');
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields);
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Use dialogSubject for assessment creation
    const subjectToUse = dialogSubject;
    
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
    if (!selectedAssessmentForGrading) return;
    
    const selectedAssessmentData = assessments?.find(a => a.id === selectedAssessmentForGrading);
    if (!selectedAssessmentData) return;

    const gradesData = Object.entries(grades)
      .filter(([_, data]) => data.marks.trim() !== '')
      .map(([studentId, data]) => ({
        assessmentId: selectedAssessmentForGrading,
        studentId,
        marksObtained: parseInt(data.marks),
        grade: calculateGrade(parseInt(data.marks), selectedAssessmentData.totalMarks),
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

  const handleEnterScores = (assessmentId: string) => {
    setSelectedAssessmentForGrading(assessmentId);
    setGrades({}); // Reset grades when switching assessments
  };

  const handleBackToDashboard = () => {
    setSelectedAssessmentForGrading(null);
    setGrades({});
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    return Array.isArray(subjects) ? subjects.find((s: any) => s.id === subjectId)?.name || 'Unknown Subject' : 'Unknown Subject';
  };

  const selectedAssessmentData = assessments?.find(a => a.id === selectedAssessmentForGrading);

  // Grade Entry View - When an assessment is selected for grading
  if (selectedAssessmentForGrading && selectedAssessmentData) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Enter Scores</h1>
            <p className="text-gray-600 mt-1">
              {selectedAssessmentData.name} - {getSubjectName(selectedAssessmentData.subjectId)}
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToDashboard} data-testid="button-back-dashboard">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
        </div>

        {/* Student List for Grade Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <p className="text-sm text-gray-600">
              Enter the marks obtained by each student. Total marks for this assessment are{' '}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                {selectedAssessmentData.totalMarks}
              </span>
              .
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b font-medium text-gray-700">
                <div>Student ID</div>
                <div>Student Name</div>
                <div></div>
                <div>Score</div>
              </div>
              
              {students?.map((student) => {
                const studentGrade = grades[student.id];
                const marks = studentGrade?.marks || '';
                
                return (
                  <div key={student.id} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="font-medium" data-testid={`text-student-id-${student.id}`}>
                      {student.rollNumber}
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <span data-testid={`text-student-name-${student.id}`}>
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                    <div></div>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        placeholder="0"
                        value={marks}
                        onChange={(e) => handleGradeChange(student.id, 'marks', e.target.value)}
                        className="w-20 text-center"
                        max={selectedAssessmentData.totalMarks}
                        min="0"
                        data-testid={`input-score-${student.id}`}
                      />
                      <span className="ml-2 text-gray-500">/ {selectedAssessmentData.totalMarks}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSubmitGrades}
                disabled={createGradesMutation.isPending}
                data-testid="button-submit-grades"
              >
                {createGradesMutation.isPending ? 'Submitting...' : 'Save Grades'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Assessments Table View
  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gradebook</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-assessment">
              <i className="fas fa-plus mr-2"></i>
              Create New Assessment
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
                    {Array.isArray(subjects) && subjects.map((subject: any) => (
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
                  onChange={(e) => {
                    console.log('Assessment name changed:', e.target.value);
                    setNewAssessment(prev => ({ ...prev, name: e.target.value }));
                  }}
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
                  onChange={(e) => {
                    console.log('Total marks changed:', e.target.value);
                    setNewAssessment(prev => ({ ...prev, totalMarks: e.target.value }));
                  }}
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

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <p className="text-sm text-gray-600">View and manage your created assessments.</p>
        </CardHeader>
        <CardContent>
          {assessments && assessments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entries</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Marks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} data-testid={`row-assessment-${assessment.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium" data-testid={`text-assessment-title-${assessment.id}`}>
                          {assessment.name}
                        </div>
                      </td>
                      <td className="px-4 py-3" data-testid={`text-assessment-subject-${assessment.id}`}>
                        {getSubjectName(assessment.subjectId)}
                      </td>
                      <td className="px-4 py-3" data-testid={`text-assessment-date-${assessment.id}`}>
                        {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" data-testid={`text-assessment-entries-${assessment.id}`}>
                        0 / {students?.length || 0}
                      </td>
                      <td className="px-4 py-3" data-testid={`text-assessment-marks-${assessment.id}`}>
                        {assessment.totalMarks}
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEnterScores(assessment.id)}
                          data-testid={`button-enter-scores-${assessment.id}`}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Enter Scores
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No assessments created yet.</p>
              <p className="text-sm mt-1">Click "Create New Assessment" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
