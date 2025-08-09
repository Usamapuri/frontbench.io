import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Mail, 
  Users,
  Link as LinkIcon,
  CheckCircle
} from "lucide-react";

interface Student {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  parentId: string | null;
  classLevel: string;
  isActive: boolean;
}

export default function PortalLinks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch all students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Filter students based on search term
  const filteredStudents = students?.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Generate portal link
  const generatePortalLink = (studentId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student/${studentId}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async (studentId: string, studentName: string) => {
    const link = generatePortalLink(studentId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinks(prev => new Set(Array.from(prev).concat([studentId])));
      toast({
        title: "Link Copied!",
        description: `Portal link for ${studentName} copied to clipboard`,
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const updated = new Set(Array.from(prev));
          updated.delete(studentId);
          return updated;
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Generate QR code (placeholder for now)
  const generateQRCode = (studentId: string, studentName: string) => {
    toast({
      title: "QR Code Feature",
      description: `QR code generation for ${studentName} would open here`,
    });
  };

  // Send email (placeholder for now)
  const sendEmail = (studentId: string, studentName: string) => {
    const link = generatePortalLink(studentId);
    const subject = `Student Portal Access - ${studentName}`;
    const body = `Dear Parent,\n\nYou can access your child's academic portal using the following link:\n\n${link}\n\nThis portal provides real-time access to:\n- Attendance records\n- Grades and assessments\n- Fee status and payments\n\nBest regards,\nPrimax Academy`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Portal Links</h1>
        <p className="text-gray-600">Generate and share direct portal access links with parents</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-student-search"
            />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Found {filteredStudents.length} students
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const portalLink = generatePortalLink(student.id);
            const isCopied = copiedLinks.has(student.id);
            
            return (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <Badge 
                      variant={student.isActive ? "default" : "secondary"}
                      className={student.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Roll: {student.rollNumber}</p>
                    <p>Level: {student.classLevel.toUpperCase()}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Portal Link Display */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Portal Link</span>
                    </div>
                    <div className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border">
                      {portalLink}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => copyToClipboard(student.id, `${student.firstName} ${student.lastName}`)}
                      variant={isCopied ? "default" : "outline"}
                      className={`w-full ${isCopied ? "bg-green-600 hover:bg-green-700" : ""}`}
                      data-testid={`button-copy-${student.id}`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => window.open(portalLink, '_blank')}
                        variant="outline"
                        size="sm"
                        data-testid={`button-preview-${student.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => sendEmail(student.id, `${student.firstName} ${student.lastName}`)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-email-${student.id}`}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStudents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search criteria" : "No students available"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">How to use Portal Links</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Copy Link:</strong> Share the URL directly with parents via WhatsApp, SMS, or other messaging apps</p>
            <p>• <strong>Preview:</strong> Test the portal link to ensure it works correctly</p>
            <p>• <strong>Email:</strong> Send a professionally formatted email with the portal link</p>
            <p>• <strong>Security:</strong> Each link is unique to a student and provides view-only access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}