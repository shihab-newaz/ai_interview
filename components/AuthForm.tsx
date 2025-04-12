"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useState } from "react";
import { z } from "zod"
import { useRouter } from "next/navigation";
import { AuthFormSchema } from "@/schemas/AuthFormSchema";
import { SignUpSchema } from "@/schemas/SignUpSchema";
import {toast} from "sonner"
import Link from "next/link";
import ReusableForm from "@/components/common/ReusableForm";

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const isSignIn = type === "sign-in";
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Use the appropriate schema based on the form type
  const schema = isSignIn ? AuthFormSchema : SignUpSchema;

  // Initialize the form with react-hook-form and zod resolver
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Form submission handler with error handling and loading state
  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setIsLoading(true);
      setServerError(null);
      
      // Simulate API call with potential failure
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Uncomment and modify this code to connect to your actual authentication API
      /*
      const response = await fetch(`/api/auth/${isSignIn ? 'signin' : 'signup'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const data = await response.json();
      // Store authentication token
      localStorage.setItem('authToken', data.token);
      */
      
      // Redirect after successful authentication
      router.push(isSignIn ? '/dashboard' : '/onboarding');
      
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed. Please try again.");
      setServerError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  // Define form fields based on form type with strong validation
  const fields = {
    ...(isSignIn ? {} : {
      username: {
        label: "Username",
        description: "Choose a unique username (3-50 characters, letters, numbers, underscores, hyphens only)",
        type: "text",
        placeholder: "your username",
        required: true,
      },
    }),
    email: {
      label: "Email Address",
      description: "We'll never share your email with anyone else",
      type: "email",
      placeholder: "you@example.com",
      required: true,
    },
    password: {
      label: "Password",
      type: "password",
      description: isSignIn 
        ? "" 
        : "Must contain at least 8 characters, including uppercase, lowercase, number, and special character",
      placeholder: "Enter password", 
      required: true,
    },
    ...(isSignIn ? {} : {
      confirmPassword: {
        label: "Confirm Password",
        description: "Re-enter your password to confirm",
        type: "password",
        placeholder: "Enter password again",
        required: true,
      },
    }),
  };

  // Additional content for "Remember me" and "Forgot password"
  const additionalAuthContent = (
    <>
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{serverError}</span>
        </div>
      )}
      
      {isSignIn && (
        <div className="flex items-center justify-between mt-2 mb-2">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
            Forgot password?
          </Link>
        </div>
      )}
      
      {!isSignIn && (
        <div className="text-xs text-gray-500 mt-2 mb-2">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={40} width={40} />
        </div>
        
        <h3 className="text-2xl font-bold text-center">
          {isSignIn ? "Welcome Back" : "Create Your Account"}
        </h3>
        
        <p className="text-center text-gray-500">
          {isSignIn 
            ? "Enter your credentials to access your account" 
            : "Fill in your information to get started"}
        </p>
        
        {/* Social login options */}
        <div className="flex flex-col gap-3 mb-2">
          <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.033s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.787-1.676-4.139-2.701-6.735-2.701-5.522 0-10.003 4.481-10.003 10.003s4.481 10.003 10.003 10.003c8.328 0 10.162-7.661 9.318-11.669l-9.318-0.003z"
                fill="#4285F4"
              />
            </svg>
            Continue with Google
          </button>
          
          <div className="relative flex items-center mt-2 mb-2">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or continue with email</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
        </div>
        
        <ReusableForm 
          form={form} 
          onSubmit={onSubmit} 
          fields={fields} 
          submitText={isLoading ? "Processing..." : (isSignIn ? "Sign In" : "Create Account")}
          isLoading={isLoading}
          submitClassName="bg-blue-600 hover:bg-blue-700 text-white"
          additionalContent={additionalAuthContent}
        />
        
        <div className="text-center text-sm mt-4">
          {isSignIn 
            ? "Don't have an account? " 
            : "Already have an account? "}
          <Link href={isSignIn ? "/sign-up" : "/sign-in"} className="text-blue-600 hover:underline">
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 