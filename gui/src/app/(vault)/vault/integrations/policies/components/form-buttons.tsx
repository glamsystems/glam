"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface FormButtonsProps {
  integrationName: string;
  onReset: (event: React.MouseEvent) => void;
  isLoading?: boolean;
  isDirty?: boolean;
  onSubmit?: () => void;
}

export function FormButtons({
  integrationName,
  onReset,
  isLoading,
  isDirty,
  onSubmit,
}: FormButtonsProps) {
  return (
    <div className="flex space-x-4">
      <Button
        className="w-1/2"
        variant="ghost"
        onClick={onReset}
        disabled={isLoading || !isDirty}
      >
        Reset
      </Button>
      <Button
        className="w-1/2"
        type="button"
        disabled={!isDirty}
        loading={isLoading}
        onClick={onSubmit}
      >
        Update {integrationName} Policies
      </Button>
    </div>
  );
}
