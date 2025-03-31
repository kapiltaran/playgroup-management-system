import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStudentSchema } from "@shared/schema";
import { QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const formSchema = insertStudentSchema.extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in format YYYY-MM-DD",
  }),
  gender: z.enum(["male", "female", "other"]),
  guardianName: z.string().min(2, "Guardian name must be at least 2 characters"),
  phone: z.string()
    .min(6, "Phone number must be at least 6 digits")
    .regex(/^[+]?[\d\s()-]+$/, "Phone number can only contain digits, +, spaces, () and -"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal/PIN code must be at least 3 characters"),
  state: z.string().min(2, "State/Province must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  status: z.enum(["active", "inactive", "on_leave"]),
  createAccount: z.boolean().optional().default(true)
});

type StudentFormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<any>; // Should return the created/updated student
  defaultValues?: Partial<StudentFormValues> & { id?: number };
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function StudentForm({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  isEditing = false,
}: StudentFormProps) {
  const { toast } = useToast();
  const [creatingAccount, setCreatingAccount] = useState(false);
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      fullName: "",
      dateOfBirth: "",
      age: 0,
      gender: "male",
      guardianName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
      status: "active",
      notes: "",
      createAccount: true, // Set default to true
    },
  });

  const handleSubmit = async (values: StudentFormValues) => {
    try {
      // First submit student data
      const studentData = { ...values };
      const createAccount = studentData.createAccount;
      console.log("🔴 CRITICAL DEBUG - Form submission with createAccount:", createAccount);
      console.log("🔴 CRITICAL DEBUG - Form values:", JSON.stringify(values, null, 2));
      
      // Remove createAccount as it's not part of the Student schema
      if ('createAccount' in studentData) {
        delete (studentData as any).createAccount;
      }
      
      let studentId: number;
      
      // Use the parent's onSubmit function which will use the proper mutation
      if (isEditing && defaultValues?.id) {
        // Handle editing existing student
        console.log("Updating existing student:", defaultValues.id);
        try {
          // We use the parent component's mutation through onSubmit
          const updatedStudent = await onSubmit(studentData);
          console.log("Updated student result:", updatedStudent);
          
          // No need to create account when editing
          return;
        } catch (error) {
          console.error("Error updating student:", error);
          throw error;
        }
      } else {
        // Create new student through parent's handler that uses mutation
        console.log("Creating new student");
        
        try {
          // Use the parent component's mutation through onSubmit
          const newStudent = await onSubmit(studentData);
          console.log("New student created:", newStudent);
          
          // This part is critical - get the ID directly from the API response data
          // not relying on the returned object which might be transformed by TanStack Query
          
          // If we get a non-object response
          if (!newStudent || typeof newStudent !== 'object') {
            console.error("Invalid student creation response:", newStudent);
            throw new Error("Student creation failed - invalid response");
          }
          
          if (!newStudent.id) {
            // Try to get the student we just created by querying the API
            console.log("Student created but ID missing, fetching latest student");
            const latestStudents = await apiRequest("GET", "/api/students", null);
            console.log("All students:", latestStudents);
            
            if (Array.isArray(latestStudents) && latestStudents.length > 0) {
              // Find the matching student by checking all fields
              const matchingStudent = latestStudents.find(s => 
                s.fullName === studentData.fullName && 
                s.email === studentData.email && 
                s.guardianName === studentData.guardianName
              );
              
              if (matchingStudent) {
                console.log("Found matching student:", matchingStudent);
                studentId = matchingStudent.id;
              } else {
                // Use the last created student as fallback
                const lastStudent = latestStudents[latestStudents.length - 1];
                console.log("Using last created student:", lastStudent);
                studentId = lastStudent.id;
              }
            } else {
              throw new Error("Failed to retrieve student ID after creation");
            }
          } else {
            console.log("New student ID direct from response:", newStudent.id);
            studentId = newStudent.id;
          }
          
          // Extra validation
          if (!studentId || typeof studentId !== 'number') {
            throw new Error(`Invalid student ID: ${studentId}`);
          }
          
          console.log("Using student ID for account creation:", studentId);
          
          if (!createAccount) {
            toast({
              title: "Success",
              description: "Student added successfully.",
            });
            return;
          }
        } catch (error) {
          console.error("Error creating student:", error);
          throw error;
        }
        
        // Handle parent account creation if needed
        if (createAccount) {
          console.log("Creating parent account for student ID:", studentId);
          setCreatingAccount(true);
          
          try {
            // Make a direct API call instead of using the imported function
            console.log("Making direct API call to create parent account for student ID:", studentId);
            
            if (!studentId) {
              throw new Error("Student ID is undefined. Cannot create parent account.");
            }
            
            // Direct API call to create parent account
            const accountResponse = await fetch(`/api/students/${studentId}/create-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            console.log("Parent account creation status:", accountResponse.status);
            
            const responseText = await accountResponse.text();
            console.log("Raw API response:", responseText);
            
            let accountData;
            try {
              // Try to parse the response as JSON
              accountData = JSON.parse(responseText);
            } catch (jsonError) {
              console.error("Failed to parse JSON response:", jsonError);
              // If JSON parsing fails, use the raw text as our data
              accountData = { message: responseText };
            }
            
            if (accountResponse.ok) {
              console.log("Parent account created successfully:", accountData);
              // Invalidate the users cache to refresh the user management page
              queryClient.invalidateQueries({ queryKey: ['/api/users'] });
              
              toast({
                title: "Account created successfully!",
                description: `A parent account has been created for ${values.guardianName} with the email ${values.email}. A welcome email with login instructions has been sent.`,
              });
            } else {
              console.error("Error creating parent account:", accountData);
              toast({
                title: "Failed to create account",
                description: accountData.message || "There was an error creating the parent account.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            console.error("Error creating parent account:", error);
            toast({
              title: "Failed to create account",
              description: error.message || "There was an error creating the parent account.",
              variant: "destructive",
            });
          } finally {
            setCreatingAccount(false);
          }
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error saving data",
        description: "There was a problem saving the student data. Please try again.",
        variant: "destructive",
      });
      setCreatingAccount(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {defaultValues?.id ? "Edit Student" : "Add New Student"}
          </SheetTitle>
          <SheetDescription>
            Fill in the details below to {defaultValues?.id ? "update" : "add"} a student.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="guardianName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guardian's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email address" 
                        type="email"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter street address"
                        className="resize-none"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/PIN Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter postal/PIN code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state/province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes"
                        className="resize-none"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isEditing && (
                <div>
                  <FormField
                    control={form.control}
                    name="createAccount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create parent account</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            This will create a parent user account with login access using the guardian's email.
                            The system will send an email with a temporary password to access the account.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    If you select this option, after saving the student, a parent account will be automatically 
                    created using the guardian's name and email.
                  </div>
                </div>
              )}
              
              <SheetFooter className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || creatingAccount}
                >
                  {isSubmitting || creatingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {creatingAccount ? "Creating account..." : "Saving..."}
                    </>
                  ) : (
                    "Save Student"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
