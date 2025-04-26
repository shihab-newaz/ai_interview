// components/common/ReusableForm.tsx
"use client";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription,
} from "@/components/ui/form"; // Assuming paths
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseFormReturn, Path, UseFormRegisterReturn, FieldValues } from "react-hook-form"; // Import FieldValues
import { z } from "zod";
import React from "react"; // Import React

/**
 * Configuration for each form field
 * @property label - The label displayed above the input
 * @property description - Optional helper text displayed below the input
 * @property register - Optional react-hook-form register return value (usually not needed)
 * @property type - Input type (text, email, password, number, etc.)
 * @property placeholder - Placeholder text for the input
 * @property required - Whether the field is required (often inferred from schema)
 */
interface FormFieldConfig {
  label: string;
  description?: string;
  register?: UseFormRegisterReturn; // Note: register is usually handled by FormField render prop
  type?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Props for the ReusableForm component
 * @template TFieldValues - Inferred type from the Zod schema
 * @property form - react-hook-form useForm return value
 * @property onSubmit - Form submission handler function (or handleSubmit result)
 * @property fields - Object mapping field names (keys from schema) to their configurations. Allows optional fields.
 * @property submitText - Text to display on the submit button
 * @property submitClassName - Additional CSS classes for the submit button
 * @property isLoading - Whether the form is currently submitting
 * @property additionalContent - Optional content to display between fields and submit button
 */
interface ReusableFormProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  // Allow onSubmit to be the result of handleSubmit for flexibility
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
  // Use a mapped type based on the form values. Allows fields to be optional.
  fields: {
    [key in keyof TFieldValues]?: FormFieldConfig; // Field config is optional for each key
  };
  submitText?: string;
  submitClassName?: string;
  isLoading?: boolean;
  additionalContent?: React.ReactNode;
}

const ReusableForm = <TFieldValues extends FieldValues>({
  form,
  onSubmit,
  fields,
  submitText = "Submit",
  submitClassName = "",
  isLoading = false,
  additionalContent,
}: ReusableFormProps<TFieldValues>) => {
  return (
    <Form {...form}>
      {/* Use the passed onSubmit directly, assuming it's form.handleSubmit result */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Filter out undefined fields before mapping */}
        {Object.entries(fields)
          .filter(([_, fieldConfig]) => fieldConfig !== undefined)
          .map(([name, field]) => (
            // Ensure field is not undefined after filtering
            field && (
              <FormField
                key={name}
                control={form.control}
                // Cast name to Path<TFieldValues> which is expected by FormField
                name={name as Path<TFieldValues>}
                render={({ field: formFieldRenderProps }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input
                        type={field.type || "text"}
                        placeholder={field.placeholder || field.label}
                        {...formFieldRenderProps} // Spread props from render
                        // {...(field.register || {})} // Remove - register is handled by render props
                      />
                    </FormControl>
                    {field.description && (
                      <FormDescription>{field.description}</FormDescription>
                    )}
                    <FormMessage /> {/* Displays validation errors */}
                  </FormItem>
                )}
              />
            )
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
