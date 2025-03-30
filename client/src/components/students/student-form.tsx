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
      console.log("Form submission with createAccount:", createAccount);
      
      // Remove createAccount as it's not part of the Student schema
      if ('createAccount' in studentData) {
        delete (studentData as any).createAccount;
      }
      
      let studentId: number;
      
      // We'll use direct API calls instead of relying on the mutation to ensure we get proper data back
      if (isEditing && defaultValues?.id) {
        // Handle editing existing student
        console.log("Updating existing student:", defaultValues.id);
        try {
          const response = await fetch(`/api/students/${defaultValues.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update student: ${errorText}`);
          }
          
          const updatedStudent = await response.json();
          console.log("Updated student result:", updatedStudent);
          
          // Still call the parent's onSubmit function for state updates
          await onSubmit(studentData);
          
          // No need to create account when editing
          return;
        } catch (error) {
          console.error("Error updating student:", error);
          throw error;
        }
      } else {
        // Create new student with direct API call
        console.log("Creating new student with direct API call");
        
        try {
          const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create student: ${errorText}`);
          }
          
          const newStudent = await response.json();
          console.log("New student created:", newStudent);
          studentId = newStudent.id;
          
          // Still call parent onSubmit for state updates
          await onSubmit(studentData);
          
          // Invalidate students query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
          
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
            const url = `/api/students/${studentId}/create-account`;
            console.log("Making parent account creation API request to:", url);
            
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error creating parent account (${response.status}):`, errorText);
              throw new Error(`Failed to create parent account: ${errorText}`);
            }
            
            const responseData = await response.json();
            console.log("Account creation response:", responseData);
            
            // Invalidate the users cache to refresh the user management page
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            
            if (responseData.linked) {
              toast({
                title: "Student linked to existing account!",
                description: `The student has been linked to an existing account with the email ${values.email}.`,
              });
            } else {
              toast({
                title: "Account created successfully!",
                description: `A parent account has been created for ${values.guardianName} with the email ${values.email}. A welcome email with login instructions has been sent.`,
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
