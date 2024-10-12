"use client";

import React from "react";

export function DevOnly({ children }: { children: React.ReactNode }) {
  return process.env.NODE_ENV === "development" ? (
    <>
      <div className="dev-only" />
      {children}
    </>
  ) : null;
}
