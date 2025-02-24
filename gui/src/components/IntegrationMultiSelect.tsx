"use client";

import React, { useCallback, useState } from "react";
import { MultiSelect } from "@/components/ui/multiple-select";
import {
  allIntegrations,
  metadata,
} from "@/app/(vault)/vault/integrations/data";

interface IntegrationData {
  value: string; // integration name
  label: string; // integration name
  name: string; // integration name
  description: string;
  labels: string[];
  imagePath: string;
  comingSoon?: boolean;
}

interface IntegrationMultiSelectProps {
  selected: string[];
  onChange: (value: string[]) => void;
}

export function IntegrationMultiSelect({
  selected,
  onChange,
}: IntegrationMultiSelectProps) {
  const [integrations] = useState<IntegrationData[]>(() => {
    // First map the integrations
    const mappedIntegrations = allIntegrations.map((integ) => ({
      value: integ.name,
      label: integ.name,
      name: integ.name,
      description: metadata[integ.name]?.description || integ.description,
      labels: metadata[integ.name]?.labels || integ.labels || [],
      imagePath: metadata[integ.name]?.imagePath || integ.imagePath,
      comingSoon: integ.comingSoon,
    }));

    // Then sort them - available first, coming soon last
    return mappedIntegrations.sort((a, b) => {
      if (a.comingSoon && !b.comingSoon) return 1;
      if (!a.comingSoon && b.comingSoon) return -1;
      return 0;
    });
  });

  const renderOption = useCallback(
    (option: IntegrationData) => (
      <div
        className={`flex items-center w-full ${option.comingSoon ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-2 flex-1">
          <img
            src={option.imagePath}
            alt={option.name}
            className="w-5 h-5"
            loading="lazy"
            decoding="async"
          />
          <span className="font-medium text-nowrap">{option.name}</span>
          <span className="ml-1.5 truncate text-muted-foreground text-xs">
            {option.description.length > 50
              ? `${option.description.slice(0, 50)}...`
              : option.description}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto pl-2">
          {option.comingSoon ? (
            <span className="text-muted-foreground">Coming Soon</span>
          ) : (
            option.labels.join(", ")
          )}
        </span>
      </div>
    ),
    [],
  );

  const renderBadge = useCallback(
    (option: IntegrationData) => (
      <div className="flex items-center gap-2">
        <img
          src={option.imagePath}
          alt={option.name}
          className="w-4 h-4"
          loading="lazy"
          decoding="async"
        />
        <span className="font-medium">{option.name}</span>
      </div>
    ),
    [],
  );

  const filterOption = useCallback(
    (option: IntegrationData, search: string) => {
      const searchLower = search.toLowerCase();
      return (
        option.name.toLowerCase().includes(searchLower) ||
        option.description.toLowerCase().includes(searchLower) ||
        option.labels.some((label) => label.toLowerCase().includes(searchLower))
      );
    },
    [],
  );

  const handleChange = useCallback(
    (newSelected: string[]) => {
      // Filter out any coming soon items that might have been selected
      const filteredSelected = newSelected.filter((value) => {
        const integration = integrations.find((i) => i.value === value);
        return integration && !integration.comingSoon;
      });
      onChange(filteredSelected);
    },
    [onChange, integrations]
  );

  return integrations.length > 0 ? (
    <MultiSelect<IntegrationData>
      options={integrations}
      selected={selected}
      onChange={handleChange}
      placeholder="Select integrations..."
      searchPlaceholder="Search integrations..."
      filterOption={filterOption}
      renderOption={renderOption}
      renderBadge={renderBadge}
    />
  ) : (
    <div>No integrations available</div>
  );
}
