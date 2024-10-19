"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageContentWrapper from "@/components/PageContentWrapper";

interface RequestMetadata {
  url: string;
  method: string;
  timestamp: string;
  headers: Record<string, string>;
}

interface ResponseMetadata {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timeElapsed: string;
}

export default function ApiPage() {
  const [apiUrl, setApiUrl] = useState(
    "https://rest.glam.systems/v0/drift/market_configs"
  );
  const [customHeaders, setCustomHeaders] = useState(
    '{\n  "Accept": "application/json",\n  "Content-Type": "application/json"\n}'
  );
  const [requestMetadata, setRequestMetadata] =
    useState<RequestMetadata | null>(null);
  const [responseMetadata, setResponseMetadata] =
    useState<ResponseMetadata | null>(null);
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setContent(null);
    setResponseMetadata(null);

    const startTime = Date.now();

    try {
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(customHeaders);
      } catch (e) {
        console.error("Invalid JSON in custom headers:", e);
        throw new Error("Invalid JSON in custom headers");
      }

      setRequestMetadata({
        url: apiUrl,
        method: "GET",
        timestamp: new Date(startTime).toISOString(),
        headers: headers,
      });

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
        mode: "cors",
      });

      const endTime = Date.now();

      setResponseMetadata({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timeElapsed: `${endTime - startTime}ms`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderMetadata = (
    metadata: RequestMetadata | ResponseMetadata | null
  ) => {
    if (loading) return <Skeleton className="h-40 w-full" />;
    if (!metadata) return <p>No data available</p>;
    return (
      <pre className="max-h-60 overflow-auto text-xs">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    );
  };

  const prefillUrls = [
    {
      url: "https://rest.glam.systems/v0/drift/market_configs",
      label: "HTTPS",
    },
    {
      url: "http://rest.glam.systems/v0/drift/market_configs",
      label: "HTTP",
    },
    {
      url: "https://randomuser.me/api/",
      label: "RNDM USER",
    },
  ];

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex space-x-2 mb-4">
          {prefillUrls.map((item, index) => (
            <Button
              key={index}
              onClick={() => setApiUrl(item.url)}
              variant="outline"
              size="sm"
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Input
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="mb-4"
          placeholder="API Endpoint"
        />
        <Textarea
          value={customHeaders}
          onChange={(e) => setCustomHeaders(e.target.value)}
          className="mb-4"
          placeholder="Custom Headers (JSON format)"
          rows={5}
        />
        <Button onClick={handleFetch} className="w-full">
          Fetch Data
        </Button>

        <div className="flex space-x-4">
          <Card className="w-1/2">
            <CardHeader>
              <CardTitle>Request Metadata</CardTitle>
            </CardHeader>
            <CardContent>{renderMetadata(requestMetadata)}</CardContent>
          </Card>

          <Card className="w-1/2">
            <CardHeader>
              <CardTitle>Response Metadata</CardTitle>
            </CardHeader>
            <CardContent>{renderMetadata(responseMetadata)}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Response Content</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : content ? (
              <pre className="max-h-96 overflow-auto text-xs">
                {JSON.stringify(content, null, 2)}
              </pre>
            ) : (
              <p>No content received</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContentWrapper>
  );
}
