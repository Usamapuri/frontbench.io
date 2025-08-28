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
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const scheduleSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
});



type ScheduleFormData = z.infer<typeof scheduleSchema>;

const dayLabels = {
  monday: "Monday",
  tuesday: "Tuesday", 
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday"
};

export default function ScheduleManager() {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const scheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      subjectId: "",
      dayOfWeek: "monday",
      startTime: "",
      endTime: "",
      location: "",
    },
  });

  

  // Fetch teacher's schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/teacher/schedules"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/schedules");
      const data = await response.json();
      // Return empty array if the response is an error or not an array
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch teacher's subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/teacher/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/subjects");
      return response.json();
    },
  });

  

  // Create/Update schedule mutation
  const scheduleUpsertMutation = useMutation({
    mutationFn: async (data: ScheduleFormData & { id?: string }) => {
      if (data.id) {
        // Update existing schedule
        return apiRequest("PUT", `/api/teacher/schedules/${data.id}`, data);
      } else {
        // Create new schedule
        return apiRequest("POST", "/api/teacher/schedules", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/schedules"] });
      setIsScheduleDialogOpen(false);
      setEditingSchedule(null);
      scheduleForm.reset();
      toast({
        title: "Success",
        description: editingSchedule ? "Schedule updated successfully!" : "Schedule created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/teacher/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/schedules"] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  

  const onScheduleSubmit = (data: ScheduleFormData) => {
    scheduleUpsertMutation.mutate(editingSchedule ? { ...data, id: editingSchedule.id } : data);
  };

  

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    scheduleForm.reset({
      subjectId: schedule.subjectId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location || "",
    });
    setIsScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  

  // Group schedules by day
  const schedulesByDay = Array.isArray(schedules) ? schedules.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {}) : {};

  // Sort each day's schedules by start time
  Object.keys(schedulesByDay).forEach(day => {
    schedulesByDay[day].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Manager</h1>
          <p className="text-muted-foreground">Manage your class schedules</p>
        </div>
        
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-schedule">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
            </DialogHeader>
            <Form {...scheduleForm}>
              <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4">
                <FormField
                  control={scheduleForm.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject: any) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={scheduleForm.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-day">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(dayLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={scheduleForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            data-testid="input-start-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={scheduleForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            data-testid="input-end-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={scheduleForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Room 101, Lab A, etc."
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={scheduleUpsertMutation.isPending} data-testid="button-save-schedule">
                    {scheduleUpsertMutation.isPending ? "Saving..." : (editingSchedule ? "Update" : "Create")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Regular Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="text-center py-8">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedules created yet. Click "Add Schedule" to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(dayLabels).map(([day, label]) => (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{label}</h3>
                  {schedulesByDay[day]?.length > 0 ? (
                    <div className="grid gap-3">
                      {schedulesByDay[day].map((schedule: any) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`schedule-item-${schedule.id}`}>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                            </div>
                            <Badge variant="outline">{schedule.subjectName}</Badge>
                            {schedule.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {schedule.location}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                              data-testid={`button-edit-${schedule.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              data-testid={`button-delete-${schedule.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No classes scheduled</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
}