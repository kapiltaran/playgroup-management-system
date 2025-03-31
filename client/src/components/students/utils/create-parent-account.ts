/**
 * Dedicated utility for creating a parent account from a student record
 */

interface CreateParentAccountResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  linked?: boolean;
  error?: string;
}

/**
 * Attempt to create a parent account for a student
 * This is a standalone function that handles all aspects of the creation process
 * including error handling and reporting
 */
export async function createParentAccount(
  studentId: number
): Promise<CreateParentAccountResponse> {
  console.log(`\n\n🚨🚨🚨 CREATE PARENT ACCOUNT FUNCTION CALLED 🚨🚨🚨`);
  console.log(`🔍 CREATE PARENT ACCOUNT: Starting for student ID ${studentId}`);
  
  try {
    if (!studentId) {
      console.error("❌ CREATE PARENT ACCOUNT: Invalid student ID");
      return {
        success: false,
        message: "Student ID is undefined. Cannot create parent account."
      };
    }
    
    console.log(`✅ CREATE PARENT ACCOUNT: Valid student ID ${studentId}, making API request to /api/students/${studentId}/create-account`);
    
    // Use the fetch API directly for more control over the response handling
    const response = await fetch(`/api/students/${studentId}/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ CREATE PARENT ACCOUNT: API request completed with status ${response.status}`);
    
    // Parse the response data
    const responseData = await response.json();
    console.log("✅ CREATE PARENT ACCOUNT: Response data:", responseData);
    
    if (!response.ok) {
      console.error(`❌ CREATE PARENT ACCOUNT: API error - ${response.status}`, responseData);
      return {
        success: false,
        message: responseData.message || `Server responded with status ${response.status}`,
        error: responseData.error
      };
    }
    
    console.log("🎉 CREATE PARENT ACCOUNT: Success!", responseData);
    
    return {
      success: true,
      message: responseData.message || "Parent account created successfully",
      user: responseData.user,
      linked: responseData.linked
    };
  } catch (error) {
    console.error("❌ CREATE PARENT ACCOUNT: Exception occurred", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      message: "Failed to create parent account due to an error",
      error: errorMessage
    };
  }
}