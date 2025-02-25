"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  CheckIcon,
  CaretSortIcon,
  CalendarIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as openfundsConstants from "@/utils/openfundsConstants";
import * as constants from "@/constants";

// Configure AJV
const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  strict: false,
  keywords: [
    "x-component",
    "x-id",
    "x-tag",
    "x-enumSource",
    "x-enumValues",
    "x-enumValuesLabel",
    "x-enumValuesValue",
    "x-hidden",
    "x-enforced",
    "x-error",
    "x-level",
    "x-order",
  ],
});
addFormats(ajv);

interface Schema {
  type: string;
  title?: string;
  fields?: { [key: string]: SchemaField };
  required?: string[];
  [key: string]: any;
}

interface SchemaField {
  type: string;
  title?: string;
  description?: string;
  default?: string;
  "x-component": string;
  "x-id"?: string;
  "x-tag"?: string;
  "x-level"?: string;
  "x-order"?: number;
  "x-enumSource"?: string;
  "x-enumValues"?: string;
  "x-enumValuesLabel"?: string;
  "x-enumValuesValue"?: string;
  "x-hidden"?: boolean;
  "x-enforced"?: boolean;
  "x-error"?: string;
  "x-placeholder"?: string;
  enum?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  [key: string]: any;
}

interface DynamicFormProps {
  schema: Schema;
  isNested?: boolean;
  groups?: string[];
  onSubmit?: (data: FormData) => void;
  onChange?: (data: FormData) => void;
  defaultValues?: FormData;
  formData?: any;
  columns?: 1 | 2;
  filters?: {
    tags?: string[];
  };
  showSubmitButton?: boolean;
}

type FormData = {
  [key: string]: any;
};

const defaultOnData = (data: FormData) => {
  console.log("Form data:", data);
};

const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  isNested = false,
  groups = [],
  columns = 1,
  onSubmit = defaultOnData,
  onChange,
  defaultValues = {},
  formData = undefined,
  filters,
  showSubmitButton = true,
}) => {
  const [formSchema] = useState<Schema>(schema);
  const [enumValues, setEnumValues] = useState<
    Record<string, { label: string; value: string | number }[]>
  >({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted
  if (!isMounted) {
    return null;
  }

  // Filter fields based on tags and hidden status
  const filterFields = (fields: Record<string, SchemaField>) => {
    return Object.entries(fields).filter(([, field]) => {
      // First check if the field is hidden
      if (field["x-hidden"]) return false;

      // If there are tag filters, check if the field's tag matches
      if (filters?.tags && filters.tags.length > 0) {
        return filters.tags.includes(field["x-tag"] || "");
      }

      // If no filters or the field passes all filters, include it
      return true;
    });
  };

  const renderFields = (fields: Record<string, SchemaField>) => {
    const filteredFields = filterFields(fields);
    const sortedFields = filteredFields.sort(
      ([, a], [, b]) => (a["x-order"] || 0) - (b["x-order"] || 0),
    );

    if (columns === 1) {
      return sortedFields.map(([key, field]) => renderField(key, field));
    } else {
      const rows = [];
      for (let i = 0; i < sortedFields.length; i += 2) {
        const row = (
          <div key={i} className="flex space-x-4">
            <div className="flex-1">
              {renderField(sortedFields[i][0], sortedFields[i][1])}
            </div>
            {i + 1 < sortedFields.length && (
              <div className="flex-1">
                {renderField(sortedFields[i + 1][0], sortedFields[i + 1][1])}
              </div>
            )}
          </div>
        );
        rows.push(row);
      }
      return rows;
    }
  };

  const validate = useMemo(() => ajv.compile(schema), [schema]);

  useEffect(() => {
    const fetchEnumValues = () => {
      const values: Record<
        string,
        { label: string; value: string | number }[]
      > = {};

      if (isNested && groups.length) {
        groups.forEach((group) => {
          if (schema[group]?.fields) {
            const fields = schema[group].fields as Record<string, SchemaField>;
            for (const [key, field] of Object.entries(fields)) {
              if (field["x-enumValues"]) {
                const enumData =
                  (openfundsConstants as any)[field["x-enumValues"]] ||
                  (constants as any)[field["x-enumValues"]];
                if (Array.isArray(enumData)) {
                  if (
                    field["x-enumValuesLabel"] &&
                    field["x-enumValuesValue"]
                  ) {
                    values[key] = enumData.map((item: any) => ({
                      label:
                        item[field["x-enumValuesLabel"] as string] ||
                        item.label,
                      value:
                        item[field["x-enumValuesValue"] as string] ||
                        item.value,
                    }));
                  } else {
                    values[key] = enumData.map((item: string, j) => ({
                      label: item,
                      value: j,
                    }));
                  }
                }
              } else if (field.enum) {
                values[key] = field.enum.map((item: string, j) => ({
                  label: item,
                  value: j,
                }));
              }
            }
          }
        });
      } else if (schema.fields) {
        for (const [key, field] of Object.entries(schema.fields)) {
          if (field["x-enumValues"]) {
            const enumData = (openfundsConstants as any)[field["x-enumValues"]];
            if (Array.isArray(enumData)) {
              values[key] = enumData.map((item: any) => ({
                label: item[field["x-enumValuesLabel"] as string] || item.label,
                value: item[field["x-enumValuesValue"] as string] || item.value,
              }));
            }
          } else if (field.enum) {
            values[key] = field.enum.map((item: string, j) => ({
              label: item,
              value: j,
            }));
          }
        }
      }

      if (JSON.stringify(enumValues) !== JSON.stringify(values)) {
        setEnumValues(values);
      }
    };

    fetchEnumValues();
  }, [schema, isNested, groups, enumValues]);

  const form =
    formData ||
    useForm<FormData>({
      resolver: async (values) => {
        const valid = validate(values);
        const errors: any = {};

        if (!valid) {
          validate.errors?.forEach((error) => {
            let fieldKey = error.instancePath.substring(1);

            if (error.keyword === "required") {
              fieldKey = error.params.missingProperty;
            }

            const fieldSchema = schema.fields?.[fieldKey];
            const customError = fieldSchema?.["x-error"];
            const requiredError =
              error.keyword === "required"
                ? `${fieldSchema?.title || fieldKey} is required.`
                : "";

            errors[fieldKey] = {
              type: error.keyword,
              message: [customError, requiredError].filter(Boolean).join(" "),
            };
          });
        }

        return {
          values: valid ? values : {},
          errors: valid ? {} : errors,
        };
      },
      defaultValues: defaultValues,
    });

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        form.setValue(key, value);
      });
    }
  }, [defaultValues, form]);

  useEffect(() => {
    if (onChange) {
      const subscription = form.watch((formData: FormData) => {
        onChange(formData);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange]);

  if (!formSchema) {
    return <div>Loading...</div>;
  }

  const renderField = (key: string, field: SchemaField) => {
    const isRequired = schema.required?.includes(key);

    return (
      <Controller
        key={key}
        name={key}
        control={form.control}
        render={({ field: formField, fieldState }) => {
          let errorMessage = "";

          if (fieldState.error) {
            if (field["x-error"]) {
              errorMessage = field["x-error"];
            } else if (fieldState.error.type === "required") {
              errorMessage = `${field.title} is required.`;
            } else if (fieldState.error.type === "type") {
              errorMessage = `Please enter a valid ${field.type}.`;
            } else {
              if (field.type === "string") {
                if (
                  field.minLength &&
                  field.maxLength &&
                  field.minLength === field.maxLength
                ) {
                  errorMessage = `${field.title} must be exactly ${field.minLength} characters long.`;
                } else if (field.minLength && field.maxLength) {
                  errorMessage = `${field.title} must be between ${field.minLength} and ${field.maxLength} characters long.`;
                } else if (field.minLength) {
                  errorMessage = `${field.title} must be at least ${field.minLength} characters long.`;
                } else if (field.maxLength) {
                  errorMessage = `${field.title} must be at most ${field.maxLength} characters long.`;
                }
              } else if (["number", "integer"].includes(field.type)) {
                if (
                  field.minValue !== undefined &&
                  field.maxValue !== undefined &&
                  field.minValue === field.maxValue
                ) {
                  errorMessage = `${field.title} must be exactly ${field.minValue}.`;
                } else if (
                  field.minValue !== undefined &&
                  field.maxValue !== undefined
                ) {
                  errorMessage = `${field.title} must be between ${field.minValue} and ${field.maxValue}.`;
                } else if (field.minValue !== undefined) {
                  errorMessage = `${field.title} must be at least ${field.minValue}.`;
                } else if (field.maxValue !== undefined) {
                  errorMessage = `${field.title} must be at most ${field.maxValue}.`;
                }
              } else {
                errorMessage = `An error occurred, please check this field.`;
              }
            }
          }

          const message =
            errorMessage || field.description || "Please review this field.";
          const isError = !!errorMessage;

          return (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center">
                {field.title}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {field["x-enforced"] && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <LockClosedIcon className="ml-2 h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Enforced Onchain</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </FormLabel>
              <FormControl>
                {renderComponent(key, field, formField)}
              </FormControl>
              <FormMessage
                className={isError ? "text-red-500" : "text-gray-500"}
              >
                {message}
              </FormMessage>
            </FormItem>
          );
        }}
      />
    );
  };

  const renderComponent = (
    key: string,
    schemaField: SchemaField,
    field: any,
  ) => {
    const options: { label: string; value: string | number }[] =
      enumValues[key] || [];
    const placeholder = schemaField["x-placeholder"] || "";

    const updateField = (value: any) => {
      field.onChange(value);
      if (formData) {
        formData.trigger(key); // Trigger validation
      }
      if (onChange) {
        onChange(form.getValues());
      }
    };

    // Handle boolean type with select component
    if (
      schemaField.type === "boolean" &&
      schemaField["x-component"] === "select"
    ) {
      return (
        <Select
          onValueChange={(value) => updateField(value === "true")}
          value={String(field.value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    switch (schemaField["x-component"]) {
      case "input":
        return (
          <Input
            {...field}
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={(e) => updateField(e.target.value)}
          />
        );
      case "textarea":
        return (
          <Textarea
            {...field}
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={(e) => updateField(e.target.value)}
          />
        );
      case "select":
        return (
          <Select
            onValueChange={(value) => updateField(value)}
            value={String(field.value ?? schemaField.default ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checkbox":
        return (
          <Checkbox
            checked={field.value ?? schemaField.default}
            onCheckedChange={updateField}
          />
        );
      case "radio":
        return (
          <RadioGroup
            onValueChange={(value) => updateField(value)}
            value={String(field.value ?? schemaField.default ?? "")}
          >
            {options.map((option) => (
              <div
                key={String(option.value)}
                className="flex items-center space-x-2"
              >
                <RadioGroupItem
                  value={String(option.value)}
                  id={String(option.value)}
                />
                <FormLabel htmlFor={String(option.value)}>
                  {option.label}
                </FormLabel>
              </div>
            ))}
          </RadioGroup>
        );
      case "switch":
        return (
          <Switch
            checked={field.value ?? schemaField.default}
            onCheckedChange={updateField}
          />
        );
      case "datePicker":
        const date = field.value
          ? new Date(field.value)
          : schemaField.default
            ? new Date(schemaField.default)
            : undefined;
        return (
          <FormItem className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    {date ? format(date, "PPP") : placeholder || "Pick a date"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) =>
                    updateField(newDate ? newDate.toISOString() : null)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        );
      case "combobox":
        return (
          <FormItem className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value
                      ? options.find((option) => option.value === field.value)
                          ?.label
                      : placeholder || "Select an option"}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Search...`} />
                  <CommandList>
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          value={option.label}
                          key={option.value}
                          onSelect={() => {
                            updateField(option.value);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              option.value === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        );
      case "checklist":
        return (
          <FormItem className="flex flex-col">
            <ScrollArea className="h-[185px] w-full border p-4">
              <FormField
                name="items"
                render={() => {
                  return (
                    <FormItem>
                      {options.map((item) => (
                        <FormField
                          key={item.value}
                          name="items"
                          render={() => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={(field.value || []).includes(
                                      item.value,
                                    )}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [
                                            ...(field.value || []),
                                            item.value,
                                          ].sort()
                                        : (field.value || []).filter(
                                            (value: number) =>
                                              value !== item.value,
                                          );
                                      updateField(newValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </FormItem>
                  );
                }}
              />
            </ScrollArea>
          </FormItem>
        );
      default:
        return (
          <Input
            {...field}
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={(e) => updateField(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      {isNested && groups.length
        ? groups.map((group) =>
            schema[group]?.fields ? renderFields(schema[group].fields) : null,
          )
        : formSchema.fields
          ? renderFields(formSchema.fields)
          : null}
      {showSubmitButton && (
        <Button type="submit" className="w-full">
          Submit
        </Button>
      )}
    </div>
  );
};

export default DynamicForm;
