import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

/**
 * This function directly calls the API to create a parent account for a student
 * It handles all potential error cases directly
 */
export async function createParentAccount(studentId: number): Promise<boolean> {
  console.log("🔍 createParentAccount called with studentId:", studentId);
  
  if (!studentId || isNaN(studentId)) {
    console.error("🚫 Invalid studentId for parent account creation:", studentId);
    throw new Error("Invalid student ID. Cannot create parent account.");
  }
  
  // Full detailed logging
  console.log("📊 Global window object availability:", typeof window !== 'undefined');
  console.log("📊 Global fetch availability:", typeof fetch !== 'undefined');
  
  // First verify the student exists
  try {
    const studentResponse = await fetch(`/api/students/${studentId}`, {
      method: "GET",
      credentials: "include"
    });
    
    if (!studentResponse.ok) {
      const errorText = await studentResponse.text();
      console.error(`🚨 Error fetching student ${studentId}:`, errorText);
      // Continue anyway - the server endpoint will handle this validation
    } else {
      const student = await studentResponse.json();
      console.log("📋 Student found for account creation:", student);
      // Check if student has valid email
      if (!student.email) {
        console.error("⚠️ Student has no email address, but we'll try anyway");
      }
    }
  } catch (error) {
    console.error("🚨 Error verifying student:", error);
    // Continue anyway - the server endpoint will handle validation
  }
  
  // For diagnosis - directly use fetch to see if we have any issues with the API request
  const endpoint = `/api/students/${studentId}/create-account`;
  console.log("🌐 Attempting direct fetch to endpoint:", endpoint);
  
  try {
    // First try with direct fetch for debugging
    const fetchResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });
    
    console.log("📝 Direct fetch response status:", fetchResponse.status);
    console.log("📝 Direct fetch response status text:", fetchResponse.statusText);
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error("🚨 Server error response:", errorText);
      throw new Error(`API request failed: ${fetchResponse.status} ${errorText}`);
    }
    
    const responseData = await fetchResponse.json();
    console.log("✅ Parent account creation response:", responseData);
    return true;
  } catch (error) {
    console.error("❌ Error creating parent account:", error);
    
    // Try a fallback approach with a slightly different endpoint format
    try {
      console.log("🔄 Attempting fallback with absolute URL");
      const fetchResponse = await fetch(`http://${window.location.host}/api/students/${studentId}/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      
      console.log("📝 Fallback fetch response status:", fetchResponse.status);
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error("🚨 Fallback server error response:", errorText);
        throw new Error(`Fallback API request failed: ${fetchResponse.status} ${errorText}`);
      }
      
      const responseData = await fetchResponse.json();
      console.log("✅ Fallback parent account creation response:", responseData);
      return true;
    } catch (fallbackError) {
      console.error("❌ Fallback approach also failed:", fallbackError);
      throw error; // Throw the original error
    }
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