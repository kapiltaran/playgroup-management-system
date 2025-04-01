import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Check, X, Clock, FileCheck } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PermissionGate from "@/components/permission-gate";

const AttendancePage = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState("mark");
  const [studentNotes, setStudentNotes] = useState<Record<number, string>>({});
  
  // Fetch teacher's classes
  const { data: teacherClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/teacher-classes', user?.id],
    queryFn: () => fetch(`/api/teacher-classes?teacherId=${user?.id}`).then(res => res.json()),
    enabled: !!user && user.role === 'teacher'
  });
  
  // Fetch all classes (for admin)
  const { data: allClasses, isLoading: allClassesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => fetch('/api/classes').then(res => res.json()),
    enabled: !!user && (user.role === 'officeadmin' || user.role === 'superadmin')
  });
  
  // Get appropriate classes based on role
  const classes = user?.role === 'teacher' ? teacherClasses : allClasses;
  const classesIsLoading = user?.role === 'teacher' ? classesLoading : allClassesLoading;
  
  // Select the first class by default when data is loaded
  React.useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass) {
      // For teachers, the classes array contains objects with a class property
      if (user?.role === 'teacher' && classes[0].class) {
        setSelectedClass(classes[0].class.id);
      } else if (classes[0].id) {
        setSelectedClass(classes[0].id);
      }
    }
  }, [classes, selectedClass, user]);
  
  // Fetch students for the selected class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students', { classId: selectedClass }],
    queryFn: () => fetch(`/api/students?classId=${selectedClass}`).then(res => res.json()),
    enabled: !!selectedClass
  });
  
  // Fetch attendance records for the selected class and date
  const { data: attendanceRecords, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/attendance', selectedClass, selectedDate],
    queryFn: () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return fetch(`/api/attendance?classId=${selectedClass}&date=${dateStr}`).then(res => res.json());
    },
    enabled: !!selectedClass && !!selectedDate
  });
  
  // Create a mutation for marking attendance
  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/attendance', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Attendance marked",
        description: "The attendance has been recorded successfully.",
      });
      // Invalidate and refetch attendance data
      queryClient.invalidateQueries({ queryKey: ['/api/attendance', selectedClass, selectedDate] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
      console.error("Error marking attendance:", error);
    }
  });
  
  // Create a mutation for updating attendance
  const updateAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/attendance/${data.id}`, 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Attendance updated",
        description: "The attendance record has been updated successfully.",
      });
      // Invalidate and refetch attendance data
      queryClient.invalidateQueries({ queryKey: ['/api/attendance', selectedClass, selectedDate] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating attendance:", error);
    }
  });
  
  // Handle marking attendance for a student
  const handleMarkAttendance = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    if (!selectedClass || !user) return;
    
    const attendanceData = {
      studentId,
      classId: selectedClass,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status,
      markedById: user.id,
      notes: notes || null
    };
    
    markAttendanceMutation.mutate(attendanceData);
  };
  
  // Handle updating an existing attendance record
  const handleUpdateAttendance = (attendanceId: number, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    if (!selectedClass || !user) return;
    
    const attendanceData = {
      id: attendanceId,
      status,
      notes: notes || null
    };
    
    updateAttendanceMutation.mutate(attendanceData);
  };
  
  // Check if attendance for a student is already marked
  const getStudentAttendance = (studentId: number) => {
    if (!attendanceRecords) return null;
    return attendanceRecords.find((record: any) => record.studentId === studentId);
  };
  
  // Initialize student notes from attendance records when records are loaded
  React.useEffect(() => {
    if (attendanceRecords && Array.isArray(attendanceRecords) && students && Array.isArray(students)) {
      const notesObj: Record<number, string> = {};
      
      students.forEach((student: any) => {
        const record = attendanceRecords.find((r: any) => r.studentId === student.id);
        if (record) {
          notesObj[student.id] = record.notes || '';
        }
      });
      
      setStudentNotes(notesObj);
    }
  }, [attendanceRecords, students]);
  
  // Render loading state
  if (classesIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading classes...</span>
      </div>
    );
  }
  
  // Render no classes message
  if (classes && classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
          <CardDescription>
            {user?.role === 'teacher' 
              ? "You're not assigned to any classes yet. Please contact an administrator."
              : "No classes found. Please create classes first."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
      </div>
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <Card className="w-full md:w-1/4">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Select a class and date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select 
                value={selectedClass?.toString()} 
                onValueChange={(value) => setSelectedClass(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((classItem: any) => (
                    <SelectItem 
                      key={user?.role === 'teacher' ? classItem.class.id : classItem.id} 
                      value={(user?.role === 'teacher' ? classItem.class.id : classItem.id).toString()}
                    >
                      {user?.role === 'teacher' ? classItem.class.name : classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        
        <div className="w-full md:w-3/4">
          <Tabs defaultValue="mark" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
              <TabsTrigger value="view">View Reports</TabsTrigger>
            </TabsList>
            
            {/* Mark Attendance Tab */}
            <TabsContent value="mark">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedClass && classes ? 
                      `Attendance for ${user?.role === 'teacher' 
                        ? classes.find((c: any) => (c.class?.id || c.id) === selectedClass)?.class?.name || 'Selected Class'
                        : classes.find((c: any) => c.id === selectedClass)?.name || 'Selected Class'}`
                      : 'Class Attendance'
                    }
                  </CardTitle>
                  <CardDescription>
                    Record attendance for {format(selectedDate, "PPPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading students...</span>
                    </div>
                  ) : (
                    <>
                      {students && students.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student: any) => {
                              const attendanceRecord = getStudentAttendance(student.id);
                              const notes = studentNotes[student.id] || '';
                              const updateNotes = (value: string) => {
                                setStudentNotes(prev => ({
                                  ...prev,
                                  [student.id]: value
                                }));
                              };
                              
                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{student.fullName}</TableCell>
                                  <TableCell>
                                    {attendanceRecord ? (
                                      <div className="flex items-center">
                                        <span className={cn(
                                          "px-2 py-1 rounded-full text-xs font-medium",
                                          attendanceRecord.status === 'present' && "bg-green-100 text-green-800",
                                          attendanceRecord.status === 'absent' && "bg-red-100 text-red-800",
                                          attendanceRecord.status === 'late' && "bg-yellow-100 text-yellow-800",
                                          attendanceRecord.status === 'excused' && "bg-blue-100 text-blue-800"
                                        )}>
                                          {attendanceRecord.status.charAt(0).toUpperCase() + attendanceRecord.status.slice(1)}
                                        </span>
                                      </div>
                                    ) : (
                                      <Select onValueChange={(value) => {
                                        handleMarkAttendance(student.id, value as any, notes || undefined);
                                      }}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="present">Present</SelectItem>
                                          <SelectItem value="absent">Absent</SelectItem>
                                          <SelectItem value="late">Late</SelectItem>
                                          <SelectItem value="excused">Excused</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Textarea 
                                      placeholder="Optional notes"
                                      value={notes}
                                      onChange={(e) => updateNotes(e.target.value)}
                                      rows={1}
                                      className="min-h-0"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {attendanceRecord ? (
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleUpdateAttendance(attendanceRecord.id, 'present', notes)}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleUpdateAttendance(attendanceRecord.id, 'absent', notes)}
                                        >
                                          <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleUpdateAttendance(attendanceRecord.id, 'late', notes)}
                                        >
                                          <Clock className="h-4 w-4 text-yellow-600" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleUpdateAttendance(attendanceRecord.id, 'excused', notes)}
                                        >
                                          <FileCheck className="h-4 w-4 text-blue-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleMarkAttendance(student.id, 'present', notes)}
                                      >
                                        Mark Present
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p>No students found in this class.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* View Reports Tab */}
            <TabsContent value="view">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Report</CardTitle>
                  <CardDescription>
                    Viewing attendance for {format(selectedDate, "PPPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading attendance records...</span>
                    </div>
                  ) : (
                    <>
                      {attendanceRecords && attendanceRecords.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead>Marked By</TableHead>
                              <TableHead>Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceRecords.map((record: any) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {students?.find((s: any) => s.id === record.studentId)?.fullName || 'Unknown Student'}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    record.status === 'present' && "bg-green-100 text-green-800",
                                    record.status === 'absent' && "bg-red-100 text-red-800",
                                    record.status === 'late' && "bg-yellow-100 text-yellow-800",
                                    record.status === 'excused' && "bg-blue-100 text-blue-800"
                                  )}>
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>{record.notes || "-"}</TableCell>
                                <TableCell>{record.markedBy || "System"}</TableCell>
                                <TableCell>{record.createdAt ? format(new Date(record.createdAt), "p") : "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p>No attendance records found for this date.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-4">
                    <div>
                      <span className="block text-sm font-medium">Present:</span>
                      <span className="font-bold text-green-600">
                        {Array.isArray(attendanceRecords) 
                          ? attendanceRecords.filter((r: any) => r.status === 'present').length 
                          : 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium">Absent:</span>
                      <span className="font-bold text-red-600">
                        {Array.isArray(attendanceRecords) 
                          ? attendanceRecords.filter((r: any) => r.status === 'absent').length 
                          : 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium">Late:</span>
                      <span className="font-bold text-yellow-600">
                        {Array.isArray(attendanceRecords) 
                          ? attendanceRecords.filter((r: any) => r.status === 'late').length 
                          : 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium">Excused:</span>
                      <span className="font-bold text-blue-600">
                        {Array.isArray(attendanceRecords) 
                          ? attendanceRecords.filter((r: any) => r.status === 'excused').length 
                          : 0}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => refetchAttendance()}>Refresh</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;