"use client";

import { Label } from "@/components/ui/label";
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { useCluster } from "@glam/anchor/react";

export default function Cluster() {
  const { cluster, clusters, setCluster } = useCluster();

  const handleClusterChange = (clusterName: string) => {
    const selectedCluster = clusters.find((c) => c.name === clusterName);
    if (selectedCluster) {
      setCluster(selectedCluster);
      toast({
        title: `Cluster changed to ${selectedCluster.name}`,
        description: selectedCluster.endpoint,
      });
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">Select Cluster</h1>
      <div className="mt-4">
        <RadioGroup
          onValueChange={handleClusterChange}
          defaultValue={cluster.name}
        >
          {clusters.map((c) => {
            return (
              <div key={c.name} className="flex items-center space-x-2">
                <RadioGroupItem value={c.name} id={c.name} />
                <Label className="w-6/12 py-2 space-y-2" htmlFor={c.name}>
                  <p>{c.name}</p>
                  <p>{c.endpoint}</p>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
