import {z} from "zod";
import { AuthFormSchema } from "./AuthFormSchema";
// Create a separate schema for sign-up that requires confirmPassword
export const SignUpSchema = AuthFormSchema.extend({
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters")
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });