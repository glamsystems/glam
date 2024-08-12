import React, { useState, useEffect } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import enum values
import * as enumValues from '@/utils/openfundsConstants';

// Define a type for enum values
type EnumValue = {
  [key: string]: string | number;
};

interface FieldConfig {
  id: string;
  fieldName: string;
  fieldType: string;
  inputType: string;
  required: boolean;
  valuesSource?: string;
  valuesArray?: string;
  valuesLabel?: string;
  valuesValue?: string;
  minLength?: string;
  maxLength?: string;
  minValue?: string;
  maxValue?: string;
  pattern?: string;
  helpText?: string;
  defaultValue?: any;
  disabled?: boolean;
  tag: string;
  description: string;
}

interface DynamicFormProps {
  formConfig: FieldConfig[];
}

const DynamicForm: React.FC<DynamicFormProps> = ({ formConfig }) => {
  const [formSchema, setFormSchema] = useState<z.ZodObject<any> | null>(null);

  useEffect(() => {
    // Build Zod schema dynamically
    const schemaObj: { [key: string]: z.ZodTypeAny } = {};
    formConfig.forEach(field => {
      if (field.fieldType === 'string') {
        let fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.fieldName} is required` });
        if (field.minLength) fieldSchema = fieldSchema.min(parseInt(field.minLength), { message: `${field.fieldName} must be at least ${field.minLength} characters` });
        if (field.maxLength) fieldSchema = fieldSchema.max(parseInt(field.maxLength), { message: `${field.fieldName} must not exceed ${field.maxLength} characters` });
        if (field.pattern) fieldSchema = fieldSchema.regex(new RegExp(field.pattern), { message: `${field.fieldName} is not in the correct format` });
        schemaObj[field.id] = fieldSchema;
      } else if (field.fieldType === 'enum') {
        schemaObj[field.id] = z.string({ required_error: `Please select a ${field.fieldName}` });
      } else if (field.fieldType === 'date') {
        schemaObj[field.id] = z.date({ required_error: `Please select a ${field.fieldName}` });
      } else if (field.fieldType === 'number') {
        let fieldSchema = z.number();
        if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.fieldName} is required` });
        if (field.minValue) fieldSchema = fieldSchema.min(parseInt(field.minValue), { message: `${field.fieldName} must be at least ${field.minValue}` });
        if (field.maxValue) fieldSchema = fieldSchema.max(parseInt(field.maxValue), { message: `${field.fieldName} must not exceed ${field.maxValue}` });
        schemaObj[field.id] = fieldSchema;
      } else if (field.fieldType === 'boolean') {
        schemaObj[field.id] = z.boolean();
      }
    });
    setFormSchema(z.object(schemaObj));
  }, [formConfig]);

  const form = useForm<FieldValues>({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: {},
  });

  useEffect(() => {
    if (formSchema) {
      form.reset(form.getValues());
    }
  }, [formSchema, form]);

  const onSubmit = (data: FieldValues) => {
    console.log(data);
    // Handle form submission
  };

  const getEnumValues = (field: FieldConfig) => {
    if (field.valuesArray && field.valuesArray in enumValues) {
      return (enumValues[field.valuesArray as keyof typeof enumValues] as any[]);
    }
    return [];
  };

  if (!formSchema) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {formConfig.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.fieldName}</FormLabel>
                <FormControl>
                  {field.inputType === 'input' && (
                    <Input
                      {...formField}
                      placeholder={field.description}
                      disabled={field.disabled}
                    />
                  )}
                  {field.inputType === 'textarea' && (
                    <Textarea
                      {...formField}
                      placeholder={field.description}
                      disabled={field.disabled}
                    />
                  )}
                  {(field.inputType === 'select' || field.inputType === 'combobox') && (
                    <Select
                      onValueChange={formField.onChange}
                      defaultValue={formField.value}
                      disabled={field.disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.fieldName}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getEnumValues(field).map((item: any) => (
                          <SelectItem key={item[field.valuesValue!]} value={item[field.valuesValue!]}>
                            {item[field.valuesLabel!]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.inputType === 'datePicker' && (
                    <Input
                      type="date"
                      {...formField}
                      disabled={field.disabled}
                    />
                  )}
                </FormControl>
                <FormDescription>{field.helpText || field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default DynamicForm;
