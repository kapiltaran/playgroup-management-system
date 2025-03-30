import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

/**
 * This function directly calls the API to create a parent account for a student
 * It handles all potential error cases directly
 */
export async function createParentAccount(studentId: number): Promise<boolean> {
  console.log("createParentAccount called with studentId:", studentId);
  
  if (!studentId || isNaN(studentId)) {
    console.error("Invalid studentId for parent account creation:", studentId);
    throw new Error("Invalid student ID. Cannot create parent account.");
  }
  
  try {
    // Make the API request
    const responseData = await apiRequest(
      "POST", 
      `/api/students/${studentId}/create-account`, 
      null
    );
    
    console.log("Parent account creation response:", responseData);
    return true;
  } catch (error) {
    console.error("Error creating parent account:", error);
    throw error;
  }
}

/**
 * Ensures we have a valid student ID, even if the original response doesn't have one
 * Will fetch all students as a fallback to find the newly created one
 */
export async function ensureStudentId(
  newStudent: any, 
  studentData: { fullName: string, email: string, guardianName: string }
): Promise<number> {
  console.log("ensureStudentId called with student:", newStudent);
  
  // Fast path - if we have an ID directly
  if (newStudent && typeof newStudent === 'object' && newStudent.id) {
    console.log("Found ID in response:", newStudent.id);
    return newStudent.id;
  }
  
  // Slow path - fetch all students and find the match
  console.log("Fetching all students to find match");
  const allStudents = await apiRequest<Student[]>("GET", "/api/students", null);
  
  // Sort in reverse order (newest first) since we want the latest additions
  const sortedStudents = [...allStudents].sort((a, b) => b.id - a.id);
  
  // Find by matching criteria
  for (const student of sortedStudents) {
    if (
      student.fullName === studentData.fullName && 
      student.email === studentData.email && 
      student.guardianName === studentData.guardianName
    ) {
      console.log("Found matching student by criteria:", student);
      return student.id;
    }
  }
  
  // Last resort - just use the most recently created student
  if (sortedStudents.length > 0) {
    const lastStudent = sortedStudents[0];
    console.log("Using most recent student as fallback:", lastStudent);
    return lastStudent.id;
  }
  
  throw new Error("Could not find student ID for parent account creation");
}