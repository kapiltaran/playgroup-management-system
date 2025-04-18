import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStudentSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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
import { queryClient } from "@/lib/queryClient";
// Import and log to verify it's working
import { createParentAccount } from "./utils/create-parent-account";
console.log("✅ IMPORTED createParentAccount function:", typeof createParentAccount, createParentAccount);

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
  createAccount: z.boolean().optional().default(true),
  // Optional academic year and class fields
  academicYearId: z.number().nullable().optional(),
  classId: z.number().nullable().optional()
}).refine(data => {
  // If academicYearId is provided, classId is required
  if (data.academicYearId !== undefined && data.academicYearId !== null) {
    return data.classId !== undefined && data.classId !== null;
  }
  return true;
}, {
  message: "Class is required when Academic Year is selected",
  path: ["classId"]
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
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  
  // Query academic years
  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ["/api/academic-years"],
    enabled: isOpen && !isEditing, // Only fetch when form is open and not in edit mode
  });
  
  // Query classes, filtered by academic year if selected
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes"],
    enabled: isOpen && !isEditing, // Only fetch when form is open and not in edit mode
  });
  
  // Log incoming defaultValues for debugging
  console.log("🔴 StudentForm received defaultValues:", defaultValues);
  
  // Create the form with defaultValues or fallback defaults
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
  
  // Force the form to reset when defaultValues change
  // This ensures the form reflects the current student data after each edit button click
  React.useEffect(() => {
    console.log("🔴 defaultValues changed, resetting form with:", defaultValues);
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSubmit = async (values: StudentFormValues) => {
    try {
      // First submit student data
      const studentData = { ...values };
      
      // Extract fields that are not part of the Student schema
      const createAccount = studentData.createAccount || false;
      const academicYearId = studentData.academicYearId || null;
      const classId = studentData.classId || null;
      
      console.log("\n\n🚨🚨🚨 STUDENT FORM SUBMISSION 🚨🚨🚨");
      console.log("🔴 CRITICAL DEBUG - Form submission with createAccount:", createAccount);
      console.log("🔴 CRITICAL DEBUG - Selected academicYearId:", academicYearId);
      console.log("🔴 CRITICAL DEBUG - Selected classId:", classId);
      console.log("🔴 CRITICAL DEBUG - Form values:", JSON.stringify(values, null, 2));
      
      // Log form field state and errors
      console.log("🔴 CRITICAL DEBUG - Form state:", JSON.stringify({
        isDirty: form.formState.isDirty,
        dirtyFields: form.formState.dirtyFields,
        isSubmitted: form.formState.isSubmitted,
        isSubmitting: form.formState.isSubmitting,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      }, null, 2));
      
      // Remove fields that are not part of the Student schema
      delete (studentData as any).createAccount;
      delete (studentData as any).academicYearId;
      delete (studentData as any).classId;
      
      // Declare student ID variable at this level for proper scope
      let studentId: number | undefined;
      
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
          // Call the mutation function to create the student
          console.log("Calling onSubmit to create new student...");
          const newStudent = await onSubmit(studentData);
          console.log("New student created:", newStudent);
          
          // There's an issue with the student creation response
          // Let's do a reliable check and get the student ID
          
          // First check if we have a proper response with an ID
          if (newStudent && typeof newStudent === 'object' && newStudent.id) {
            console.log("Got student ID directly from response:", newStudent.id);
            studentId = newStudent.id;
          } else {
            // If we don't have an ID, make a direct API call to get the latest student
            console.log("Student ID not in response, fetching latest student...");
            
            // Get all students
            const response = await fetch("/api/students");
            const students = await response.json();
            
            // Because the API returns newest students first, the first student is the one we just created
            if (students.length > 0) {
              // The first student in the array is the most recently created one (newest first)
              const latestStudent = students[0];
              console.log("Using first student in list as it's the most recent:", latestStudent);
              studentId = latestStudent.id;
            } else {
              throw new Error("Could not find any students after creation");
            }
          }
          
          // Extra validation
          if (!studentId || typeof studentId !== 'number') {
            throw new Error(`Invalid student ID: ${studentId}`);
          }
          
          console.log("Using student ID for account creation:", studentId);
          
          // If both academicYearId and classId were provided, find a matching batch and link student
          if (academicYearId && classId) {
            try {
              console.log(`Looking for batch with academicYearId=${academicYearId} and classId=${classId}`);
              
              // Fetch batches to find one matching the academic year and class
              const batchesResponse = await fetch(`/api/batches/academic-year/${academicYearId}`);
              
              if (!batchesResponse.ok) {
                throw new Error(`Failed to fetch batches: ${batchesResponse.statusText}`);
              }
              
              const batches = await batchesResponse.json();
              const matchingBatch = batches.find((batch: any) => batch.classId === classId);
              
              if (matchingBatch) {
                console.log(`Found matching batch: ${matchingBatch.id} - ${matchingBatch.name}`);
                
                // Link student to batch
                const linkResponse = await fetch(`/api/students/batch/${matchingBatch.id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ studentIds: [studentId] })
                });
                
                if (!linkResponse.ok) {
                  console.error(`Failed to link student to batch: ${linkResponse.statusText}`);
                  const errorData = await linkResponse.json();
                  console.error("Error details:", errorData);
                } else {
                  console.log("Successfully linked student to batch and associated fee structure");
                  
                  // Invalidate relevant queries
                  queryClient.invalidateQueries({ queryKey: ["/api/students"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/students/batch", matchingBatch.id] });
                  queryClient.invalidateQueries({ queryKey: ["/api/fee-reports/pending"] });
                  
                  toast({
                    title: "Success",
                    description: "Student added successfully and linked to class.",
                  });
                }
              } else {
                console.log(`No matching batch found for academicYearId=${academicYearId} and classId=${classId}`);
                toast({
                  title: "Student Added",
                  description: "Student was created but could not be assigned to a batch. You can assign the student to a batch later.",
                });
              }
            } catch (error) {
              console.error("Error linking student to batch:", error);
              toast({
                variant: "destructive",
                title: "Warning",
                description: "Student was created but there was an error linking to the selected class. You can assign the student to a class later.",
              });
            }
          }
          
          if (!createAccount) {
            if (!academicYearId || !classId) {
              toast({
                title: "Success",
                description: "Student added successfully.",
              });
            }
            return;
          }
        } catch (error) {
          console.error("Error creating student:", error);
          throw error;
        }
        
        // Handle parent account creation if needed
        if (createAccount && studentId) {
          console.log("Creating parent account for student ID:", studentId);
          setCreatingAccount(true);
          
          try {
            // Redundant check but TypeScript needs it
            if (!studentId) {
              throw new Error("Student ID is undefined. Cannot create parent account.");
            }
            
            // Make a direct API call - simpler and more reliable
            console.log("▶️▶️▶️ MAKING DIRECT API CALL to create parent account with studentId:", studentId);
            
            const response = await fetch(`/api/students/${studentId}/create-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            console.log(`◀️◀️◀️ API RESPONSE STATUS: ${response.status}`);
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error("Parent account creation failed:", errorData);
              throw new Error(errorData.message || "Failed to create parent account");
            }
            
            const result = await response.json();
            console.log("Parent account creation result:", result);
            
            // Invalidate the users cache to refresh the user management page
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            
            toast({
              title: "Account created successfully!",
              description: `A parent account has been created for ${values.guardianName} with the email ${values.email}. A welcome email with login instructions has been sent.`,
            });
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

              {/* Only show academic year and class fields when creating a new student */}
              {!isEditing && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = parseInt(value);
                            // If "None" (0) is selected, set null
                            const finalValue = numValue === 0 ? null : numValue;
                            setSelectedAcademicYearId(finalValue);
                            field.onChange(finalValue);
                          }}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {academicYears?.map((year: any) => (
                              <SelectItem key={year.id} value={year.id.toString()}>
                                {year.name} {year.isCurrent ? "(Current)" : ""}
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
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class {selectedAcademicYearId ? "(Required)" : "(Optional)"}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = parseInt(value);
                            // If "None" (0) is selected, set null
                            const finalValue = numValue === 0 ? null : numValue;
                            field.onChange(finalValue);
                          }}
                          value={field.value?.toString() || "0"}
                          disabled={!selectedAcademicYearId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedAcademicYearId ? "Select class" : "Select academic year first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {classes?.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2 text-sm text-gray-500">
                    Choosing an academic year and class will automatically assign the student to that class.
                  </div>
                </div>
              )}
              
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
                            onCheckedChange={(checked) => {
                              console.log("🔍 Checkbox changed to:", checked);
                              field.onChange(checked);
                            }}
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
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    console.log("DEBUG - Current form values:", form.getValues());
                    console.log("DEBUG - Form state:", {
                      isDirty: form.formState.isDirty,
                      dirtyFields: form.formState.dirtyFields,
                      isSubmitted: form.formState.isSubmitted,
                      isValid: form.formState.isValid,
                      errors: form.formState.errors
                    });
                    const values = form.getValues();
                    toast({
                      title: "Form Debug",
                      description: `Create Account: ${values.createAccount ? "YES" : "NO"}`
                    });
                  }}
                >
                  Debug Form
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
