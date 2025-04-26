// schemas/SignUpSchema.ts
import { z } from "zod";
import { SignInSchema } from "./SignInSchema"; 

/**
 * Zod schema for the Sign Up form.
 * Extends SignInSchema to include username and confirmPassword.
 * Adds a refinement to check if passwords match.
 */
export const SignUpSchema = SignInSchema.extend({
  username: z
    .string({ required_error: "Username is required" }) 
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  confirmPassword: z
    .string({ required_error: "Please confirm your password" }) 
    .min(8, "Confirm password must be at least 8 characters")
    .max(100, "Confirm password cannot exceed 100 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Apply error specifically to the confirmPassword field
});

// Define the inferred type for sign-up data
export type SignUpInput = z.infer<typeof SignUpSchema>;
