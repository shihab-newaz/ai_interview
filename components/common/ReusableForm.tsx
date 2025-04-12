"use client";

/**
 * ReusableForm Component - A flexible form component for React applications
 * 
 * Usage Guide:
 * -------------
 * 1. Define your Zod schema:
 *    ```
 *    const FormSchema = z.object({
 *      username: z.string().min(3, "Username must be at least 3 characters"),
 *      email: z.string().email("Please enter a valid email"),
 *      password: z.string().min(8, "Password must be at least 8 characters")
 *    });
 *    ```
 * 
 * 2. Set up your form with react-hook-form:
 *    ```
 *    const form = useForm<z.infer<typeof FormSchema>>({
 *      resolver: zodResolver(FormSchema),
 *      defaultValues: {
 *        username: "",
 *        email: "",
 *        password: ""
 *      }
 *    });
 *    ```
 * 
 * 3. Define your form submission handler:
 *    ```
 *    function onSubmit(values: z.infer<typeof FormSchema>) {
 *      console.log(values);
 *      // Process form submission here
 *    }
 *    ```
 * 
 * 4. Configure your fields:
 *    ```
 *    const fields = {
 *      username: {
 *        label: "Username",
 *        description: "Your unique username",
 *        type: "text", // optional, defaults to "text"
 *        placeholder: "johndoe" // optional, defaults to label
 *      },
 *      email: {
 *        label: "Email Address",
 *        type: "email"
 *      },
 *      password: {
 *        label: "Password",
 *        type: "password",
 *        description: "Must be at least 8 characters"
 *      }
 *    };
 *    ```
 * 
 * 5. Render the ReusableForm component:
 *    ```
 *    <ReusableForm
 *      form={form}
 *      onSubmit={onSubmit}
 *      fields={fields}
 *      submitText="Create Account"
 *      isLoading={isSubmitting}
 *      additionalContent={<div className="text-center">Additional content here</div>}
 *    />
 *    ```
 * 
 * Additional Features:
 * - submitText: Customize the submit button text (default: "Submit")
 * - submitClassName: Add custom classes to the submit button
 * - isLoading: Set to true to show loading state on submit button
 * - additionalContent: Insert additional React nodes between fields and submit button
 */

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Path, UseFormRegisterReturn } from "react-hook-form";

/**
 * Configuration for each form field
 * @property label - The label displayed above the input
 * @property description - Optional helper text displayed below the input
 * @property register - Optional react-hook-form register return value (usually not needed)
 * @property type - Input type (text, email, password, number, etc.)
 * @property placeholder - Placeholder text for the input
 * @property required - Whether the field is required
 */
interface FormFieldConfig {
  label: string;
  description?: string;
  register?: UseFormRegisterReturn;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Props for the ReusableForm component
 * @template T - Zod schema type
 * @property form - react-hook-form useForm return value
 * @property onSubmit - Form submission handler function
 * @property fields - Object mapping field names to their configurations
 * @property submitText - Text to display on the submit button
 * @property submitClassName - Additional CSS classes for the submit button
 * @property isLoading - Whether the form is currently submitting
 * @property additionalContent - Optional content to display between fields and submit button
 */
interface ReusableFormProps<T extends z.ZodType<any, any>> {
  form: UseFormReturn<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => void;
  fields: {
    [key: string]: FormFieldConfig;
  };
  submitText?: string;
  submitClassName?: string;
  isLoading?: boolean;
  additionalContent?: React.ReactNode;
}

const ReusableForm = <T extends z.ZodType<any, any>>({
  form,
  onSubmit,
  fields,
  submitText = "Submit",
  submitClassName = "",
  isLoading = false,
  additionalContent,
}: ReusableFormProps<T>) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {Object.entries(fields).map(([name, field]) => (
          <FormField
            key={name}
            control={form.control}
            name={name as Path<z.infer<T>>}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    type={field.type || "text"}
                    placeholder={field.placeholder || field.label} 
                    {...formField}
                    {...(field.register || {})}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        
        {additionalContent}
        
        <div className="flex justify-center mt-6">
          <Button 
            type="submit" 
            className={`w-full ${submitClassName}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReusableForm;