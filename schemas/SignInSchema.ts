// schemas/SignInSchema.ts
import { z } from "zod";

/**
 * Zod schema for the Sign In form.
 * Includes only email and password fields.
 */
export const SignInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" }) // Add required error message
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email cannot exceed 100 characters"),
  password: z
    .string({ required_error: "Password is required" }) // Add required error message
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters")
    // Optional: You might simplify the regex check for sign-in if not strictly needed,
    // as Firebase handles password verification. Keeping it for consistency for now.
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
      "Password format is incorrect" // More generic message for sign-in attempt
    ),
});

// Define the inferred type for sign-in data
export type SignInInput = z.infer<typeof SignInSchema>;


