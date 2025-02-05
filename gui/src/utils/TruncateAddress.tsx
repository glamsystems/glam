import React from "react";

interface TruncateAddressProps {
  address?: string; // Marking address as optional
  start?: number;
  end?: number;
}

export const truncate = (text: string, start = 5, end = 5) => {
  const firstPart = start > 0 ? text.slice(0, start) : "";
  const lastPart = end > 0 ? text.slice(-end) : "";
  return `${firstPart}...${lastPart}`;
};

const TruncateAddress: React.FC<TruncateAddressProps> = ({
  address = "", // Provide a default empty string if address is undefined
  start = 5,
  end = 5,
}) => {
  const shouldTruncate = (address || "").length > start + end;
  const truncatedAddress = shouldTruncate
    ? truncate(address, start, end)
    : address;

  return <span>{truncatedAddress}</span>;
};

export default TruncateAddress;
