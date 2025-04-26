// components/AuthForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form"; 
import Image from "next/image";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { SignInSchema } from "@/schemas/SignInSchema";
import { SignUpSchema } from "@/schemas/SignUpSchema";
import { toast } from "sonner"; // Ensure sonner is imported
import Link from "next/link";
import ReusableForm from "@/components/common/ReusableForm"; 
import { signUp, signIn } from "@/lib/actions/auth.action"; 

// --- Firebase Client SDK Imports ---
import { auth } from "@/firebase/client"; // Adjust path if needed
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";



const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const isSignIn = type === "sign-in";
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Use the appropriate schema based on the form type
  const schema = isSignIn ? SignInSchema : SignUpSchema;

  // Define appropriate default values based on the form type
  const defaultValues = isSignIn
    ? {
        email: "",
        password: "",

      }
    : {
        // Include all fields for sign-up
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      };

  // Initialize the form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    // Use the conditionally set defaultValues
    defaultValues: defaultValues as z.infer<typeof schema>, // Cast needed because TS struggles with conditional types here
    mode: "onChange", 
  });

  const processForm = async (values: z.infer<typeof schema>) => {
    console.log("Form validated successfully, proceeding to submit...");
    setIsLoading(true);
    setServerError(null);

    try {
      if (isSignIn) {
        // --- Sign In Flow ---
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email, 
          values.password 
        );
        const user = userCredential.user;
        const idToken = await user.getIdToken(true);
        const signInParams = { email: values.email, idToken };
        const signInResult = await signIn(signInParams);
        if (!signInResult?.success) {
          throw new Error(signInResult?.message || "Sign in failed on server.");
        }
        toast.success("Successfully signed in!");
        router.push("/");
      } else {
        // --- Sign Up Flow ---
        const signUpValues = values as z.infer<typeof SignUpSchema>; 
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          signUpValues.email,
          signUpValues.password
        );
        const user = userCredential.user;
        const signUpParams = {
          uid: user.uid,
          name: signUpValues.username??"", 
          email: signUpValues.email,
          password: signUpValues.password, 
        };
        const signUpResult = await signUp(signUpParams);
        if (!signUpResult?.success) {
          console.error("Server action signUp failed:", signUpResult?.message);
          throw new Error(
            signUpResult?.message || "Failed to create user record."
          );
        }
        console.log("User record created via server action.");
        toast.success("Account created successfully! Please sign in.");
        router.push("/sign-in");
      }
    } catch (error: any) {
      console.error("Authentication process error:", error);
      let errorMessage = "Authentication failed. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found": errorMessage = "No account found with this email. Please sign up."; break;
          case "auth/wrong-password": errorMessage = "Incorrect password. Please try again."; break;
          case "auth/email-already-in-use": errorMessage = "This email is already registered. Please sign in."; break;
          case "auth/invalid-email": errorMessage = "Please enter a valid email address."; break;
          case "auth/weak-password": errorMessage = "Password is too weak. Please choose a stronger password."; break;
          case "auth/too-many-requests": errorMessage = "Too many attempts. Please try again later."; break;
          default: errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      toast.error(errorMessage);
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Validation Error Handler ---
  const onValidationErrors = (errors: FieldErrors<z.infer<typeof schema>>) => {
    console.log("Form validation failed:", errors);
    setServerError(null);
    setIsLoading(false);

    Object.entries(errors).forEach(([fieldName, error]) => {
      if (error && error.message) {
         const formattedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
         console.log(`Validation Error - ${formattedFieldName}: ${error.message}`);
         toast.error(`${formattedFieldName}: ${error.message}`);
      }
    });
  };


  // --- Field Definitions ---
  const fields = isSignIn
  ? {
      email: {
        label: "Email Address",
        description: "We'll never share your email",
        type: "email",
        placeholder: "you@example.com",
        required: true,
      },
      password: {
        label: "Password",
        type: "password",
        description: "",
        placeholder: "Enter password",
        required: true,
      },
      // No username or confirmPassword fields needed for sign-in display
    }
  : {
      username: {
        label: "Username",
        description: "Choose a unique username",
        type: "text",
        placeholder: "your username",
        required: true,
      },
      email: {
        label: "Email Address",
        description: "We'll never share your email",
        type: "email",
        placeholder: "you@example.com",
        required: true,
      },
      password: {
        label: "Password",
        type: "password",
        description: "Min. 8 characters (upper, lower, num, special)",
        placeholder: "Create a password",
        required: true,
      },
      confirmPassword: {
        label: "Confirm Password",
        description: "Re-enter your password",
        type: "password",
        placeholder: "Enter password again",
        required: true,
      },
    };


  // --- Additional Auth Content ---
  const additionalAuthContent = (
    <div className="flex flex-col gap-4 mt-2">
      {serverError && (
        <div className="text-red-500 text-sm text-center">{serverError}</div>
      )}
      <div className="text-sm text-gray-500 text-center">
        {isSignIn ? (
          <p>
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );


  return (
     <div className="card-border lg:min-w-[566px]">
       <div className="flex flex-col gap-6 card py-14 px-10">
         {/* Header */}
         <div className="flex flex-row gap-2 justify-center">
             <Image src="/logo.svg" alt="logo" height={40} width={40} />
         </div>
         <h3 className="text-2xl font-bold text-center">
             {isSignIn ? "Welcome Back" : "Create Your Account"}
         </h3>
         <p className="text-center text-gray-500">
             {isSignIn ? "Enter your credentials" : "Fill in your information"}
         </p>

         {/* Social login options */}
         <div className="flex flex-col gap-3 mb-2">
             <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                 <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.033s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.787-1.676-4.139-2.701-6.735-2.701-5.522 0-10.003 4.481-10.003 10.003s4.481 10.003 10.003 10.003c8.328 0 10.162-7.661 9.318-11.669l-9.318-0.003z" fill="#4285F4"/></svg>
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
           onSubmit={form.handleSubmit(processForm, onValidationErrors)}
           fields={fields} // Pass the conditionally defined fields
           submitText={ isLoading ? "Processing..." : (isSignIn ? "Sign In" : "Create Account")}
           isLoading={isLoading}
           submitClassName="bg-blue-600 hover:bg-blue-700 text-white w-full"
           additionalContent={additionalAuthContent}
         />

       </div>
     </div>
  );
};

export default AuthForm;
