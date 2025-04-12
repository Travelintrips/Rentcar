import { supabase } from "./supabase";

/**
 * Helper function to invoke Supabase Edge Functions
 * @param functionName The name of the function to invoke
 * @param payload The payload to send to the function
 * @returns The response from the function
 */
export async function invokeEdgeFunction<T = any, P = any>(
  functionName: string,
  payload?: P,
): Promise<{
  data: T | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: payload,
    });

    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception invoking ${functionName}:`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Assign a role to a user
 * @param userId The user ID
 * @param roleId The role ID
 * @returns The response from the function
 */
export async function assignUserRole(userId: string, roleId: number) {
  return invokeEdgeFunction("supabase-functions-assignRole", {
    userId,
    roleId,
  });
}
