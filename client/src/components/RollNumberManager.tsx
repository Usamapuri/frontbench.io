import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function RollNumberManager() {
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('');
  const [customRollNumber, setCustomRollNumber] = useState('');
  const [checkingRollNumber, setCheckingRollNumber] = useState('');
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get next available roll number
  const { data: nextRollNumber, isLoading: loadingNext } = useQuery({
    queryKey: ['/api/roll-numbers/next', selectedClassLevel],
    enabled: !!selectedClassLevel,
  });

  // Get students for overview
  const { data: students } = useQuery({
    queryKey: ['/api/students'],
  });

  // Check custom roll number availability
  const checkRollNumberMutation = useMutation({
    mutationFn: async (rollNumber: string) => {
      return await apiRequest('/api/roll-numbers/check', {
        method: 'POST',
        body: JSON.stringify({ rollNumber }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: data.available ? 'Roll Number Available' : 'Roll Number Taken',
        description: data.available 
          ? `${data.rollNumber} is available for use` 
          : `${data.rollNumber} is already assigned to another student`,
        variant: data.available ? 'default' : 'destructive',
      });
    },
  });

  // Bulk assign roll numbers
  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/roll-numbers/assign-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Roll Numbers Assigned',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setShowBulkAssignDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign roll numbers',
        variant: 'destructive',
      });
    },
  });

  const handleCheckRollNumber = () => {
    if (!checkingRollNumber.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a roll number to check',
        variant: 'destructive',
      });
      return;
    }
    checkRollNumberMutation.mutate(checkingRollNumber.trim());
  };

  // Analyze current students for statistics
  const getStudentStats = () => {
    if (!students || !Array.isArray(students)) return { total: 0, withRollNumbers: 0, withoutRollNumbers: 0, oLevel: 0, aLevel: 0, properFormat: 0, legacyFormat: 0 };
    
    const stats = {
      total: students.length,
      withRollNumbers: 0,
      withoutRollNumbers: 0,
      oLevel: 0,
      aLevel: 0,
      properFormat: 0,
      legacyFormat: 0,
    };

    students.forEach((student: any) => {
      // Count by class level
      if (student.classLevel === 'o-level') stats.oLevel++;
      if (student.classLevel === 'a-level') stats.aLevel++;

      // Check roll number status
      if (student.rollNumber) {
        stats.withRollNumbers++;
        // Check if it's in proper format (YYLSSSS)
        if (/^(24|25|26|27)[OA]\d{4}$/.test(student.rollNumber)) {
          stats.properFormat++;
        } else {
          stats.legacyFormat++;
        }
      } else {
        stats.withoutRollNumbers++;
      }
    });

    return stats;
  };

  const stats = getStudentStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roll Number Management System</CardTitle>
          <p className="text-sm text-gray-600">
            Manage and assign unique roll numbers to students with automatic generation
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Students</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">With Roll Numbers</h3>
              <p className="text-2xl font-bold text-green-900">{stats.withRollNumbers}</p>
              <p className="text-xs text-green-600">
                {stats.properFormat} proper format, {stats.legacyFormat} legacy
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">O-Level Students</h3>
              <p className="text-2xl font-bold text-orange-900">{stats.oLevel}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">A-Level Students</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.aLevel}</p>
            </div>
          </div>

          {stats.withoutRollNumbers > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">
                    ⚠️ {stats.withoutRollNumbers} students without proper roll numbers
                  </h3>
                  <p className="text-sm text-red-600">
                    These students need roll numbers assigned to maintain proper record keeping
                  </p>
                </div>
                <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-bulk-assign">
                      <i className="fas fa-magic mr-2"></i>
                      Auto-Assign All
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Assign Roll Numbers</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        This will automatically assign roll numbers to all students who don't have proper ones.
                        The system will use the format: <strong>YYLSSSS</strong>
                      </p>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs">
                          <strong>Format Explanation:</strong><br />
                          YY = Year (25 for 2025)<br />
                          L = Level (O for O-Level, A for A-Level)<br />
                          SSSS = Sequential number (0001, 0002, etc.)
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowBulkAssignDialog(false)}
                          data-testid="button-cancel-bulk"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => bulkAssignMutation.mutate()}
                          disabled={bulkAssignMutation.isPending}
                          data-testid="button-confirm-bulk"
                        >
                          {bulkAssignMutation.isPending ? 'Assigning...' : `Assign ${stats.withoutRollNumbers} Roll Numbers`}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Roll Number Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Next Roll Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="classLevel">Select Class Level</Label>
              <Select value={selectedClassLevel} onValueChange={setSelectedClassLevel}>
                <SelectTrigger data-testid="select-class-level">
                  <SelectValue placeholder="Choose class level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="o-level">O-Level</SelectItem>
                  <SelectItem value="a-level">A-Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedClassLevel && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Next Available Roll Number</h3>
                {loadingNext ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span>Generating...</span>
                  </div>
                ) : nextRollNumber ? (
                  <div>
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-next-roll-number">
                      {(nextRollNumber as any).nextRollNumber}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Format: {(nextRollNumber as any).format}
                    </p>
                    <p className="text-xs text-gray-500">
                      Example: {(nextRollNumber as any).example}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500">Failed to generate roll number</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roll Number Checker */}
        <Card>
          <CardHeader>
            <CardTitle>Check Roll Number Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="checkRollNumber">Enter Roll Number</Label>
              <Input
                id="checkRollNumber"
                value={checkingRollNumber}
                onChange={(e) => setCheckingRollNumber(e.target.value)}
                placeholder="e.g., 25O0001 or 25A0001"
                data-testid="input-check-roll-number"
              />
            </div>
            <Button
              onClick={handleCheckRollNumber}
              disabled={checkRollNumberMutation.isPending || !checkingRollNumber.trim()}
              className="w-full"
              data-testid="button-check-availability"
            >
              {checkRollNumberMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Checking...
                </>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Check Availability
                </>
              )}
            </Button>

            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold text-sm mb-2">Roll Number Format Guide</h4>
              <div className="text-xs space-y-1">
                <p><strong>25O0001</strong> - 2025 O-Level student #1</p>
                <p><strong>25A0001</strong> - 2025 A-Level student #1</p>
                <p><strong>26O0001</strong> - 2026 O-Level student #1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students with Issues */}
      {stats.legacyFormat > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Students with Legacy Roll Numbers</CardTitle>
            <p className="text-sm text-gray-600">
              {stats.legacyFormat} students have old-format roll numbers that should be updated
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(students) && students.filter((student: any) => 
                student.rollNumber && !/^(24|25|26|27)[OA]\d{4}$/.test(student.rollNumber)
              ).slice(0, 10).map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                    <Badge variant="outline" className="ml-2">{student.classLevel}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{student.rollNumber}</div>
                    <div className="text-xs text-yellow-600">Legacy format</div>
                  </div>
                </div>
              ))}
              {Array.isArray(students) && students.filter((student: any) => 
                student.rollNumber && !/^(24|25|26|27)[OA]\d{4}$/.test(student.rollNumber)
              ).length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ...and {students.filter((student: any) => 
                    student.rollNumber && !/^(24|25|26|27)[OA]\d{4}$/.test(student.rollNumber)
                  ).length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}