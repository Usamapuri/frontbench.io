import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, BookOpen, Users, Calendar, AlertCircle, CheckCircle2, Clock, Edit, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["homework", "notice", "reminder", "announcement"]),
  priority: z.enum(["low", "medium", "high"]),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  dueDate: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  broadcastType: z.enum(["all", "class", "specific"]).default("all"),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function DigitalDiary() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "homework" | "notice" | "reminder" | "announcement">("all");
  const [broadcastType, setBroadcastType] = useState<"all" | "class" | "specific">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "announcement",
      priority: "medium",
      subjectId: "",
      classId: "",
      dueDate: "",
      recipients: [],
      broadcastType: "all",
    },
  });

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const response = await fetch("/api/announcements?teacherId=demo-user");
      return response.json();
    },
  });

  // Fetch subjects and classes for the dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      return response.json();
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const response = await fetch("/api/classes");
      return response.json();
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students");
      return response.json();
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      // Prepare announcement data with recipient logic
      const announcementData = { ...data };
      
      // Determine recipients based on broadcast type
      if (data.broadcastType === "all") {
        // Get all students for broadcast to all
        const studentsResponse = await fetch("/api/students");
        const allStudents = await studentsResponse.json();
        announcementData.recipients = allStudents.map((student: any) => student.id);
      } else if (data.broadcastType === "class" && data.classId) {
        // Get students in specific class
        const studentsResponse = await fetch(`/api/classes/${data.classId}/students`);
        const classStudents = await studentsResponse.json();
        announcementData.recipients = classStudents.map((student: any) => student.id);
      } else if (data.broadcastType === "specific") {
        // Use manually selected recipients
        announcementData.recipients = data.recipients || [];
      }
      
      console.log("Creating announcement with data:", announcementData);
      
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementData),
      });
      if (!response.ok) throw new Error("Failed to create announcement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsCreateDialogOpen(false);
      form.reset();
      setBroadcastType("all");
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete announcement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully!",
      });
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    // Add broadcast type from state to form data
    const submitData = { ...data, broadcastType };
    createAnnouncementMutation.mutate(submitData);
  };

  const filteredAnnouncements = Array.isArray(announcements) 
    ? announcements.filter((announcement: any) => 
        selectedFilter === "all" || announcement.type === selectedFilter
      )
    : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "homework": return <BookOpen className="h-4 w-4" />;
      case "notice": return <AlertCircle className="h-4 w-4" />;
      case "reminder": return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Diary</h1>
          <p className="text-muted-foreground">Create and manage announcements for your students</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-announcement">
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter announcement title" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter announcement content" rows={4} data-testid="textarea-content" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="notice">Notice</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(subjects) && subjects.map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Recipients Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recipients
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Send to:</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="broadcast"
                          value="all"
                          checked={broadcastType === "all"}
                          onChange={(e) => setBroadcastType(e.target.value as "all" | "class" | "specific")}
                          className="text-blue-600"
                        />
                        <span className="text-sm">All Students</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="broadcast"
                          value="class"
                          checked={broadcastType === "class"}
                          onChange={(e) => setBroadcastType(e.target.value as "all" | "class" | "specific")}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Specific Class</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="broadcast"
                          value="specific"
                          checked={broadcastType === "specific"}
                          onChange={(e) => setBroadcastType(e.target.value as "all" | "class" | "specific")}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Select Specific Students</span>
                      </label>
                    </div>
                  </div>

                  {/* Class selector for class broadcast */}
                  {broadcastType === "class" && (
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Class</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-class">
                                <SelectValue placeholder="Choose a class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(classes) && classes.map((cls: any) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} - {cls.level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Student multi-selector for specific broadcast */}
                  {broadcastType === "specific" && (
                    <FormField
                      control={form.control}
                      name="recipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Students</FormLabel>
                          <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                            {Array.isArray(students) && students.map((student: any) => (
                              <label key={student.id} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(student.id) || false}
                                  onChange={(e) => {
                                    const currentValue = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValue, student.id]);
                                    } else {
                                      field.onChange(currentValue.filter(id => id !== student.id));
                                    }
                                  }}
                                  className="text-blue-600"
                                />
                                <span>{student.firstName} {student.lastName} ({student.classLevel})</span>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAnnouncementMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2">
        {["all", "homework", "notice", "reminder", "announcement"].map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "outline"}
            onClick={() => setSelectedFilter(filter as any)}
            className="capitalize"
            data-testid={`filter-${filter}`}
          >
            {filter === "all" ? "All" : filter}
          </Button>
        ))}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedFilter === "all" 
                  ? "Create your first announcement to get started"
                  : `No ${selectedFilter} announcements found`
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement: any) => (
            <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(announcement.type)}
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <Badge variant={getPriorityColor(announcement.priority) as any}>
                      {announcement.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {announcement.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                      data-testid={`button-delete-${announcement.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  {announcement.dueDate && (
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {new Date(announcement.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap" data-testid={`text-content-${announcement.id}`}>
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}