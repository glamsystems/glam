import React from "react";

interface TruncateAddressProps {
  address?: string; // Marking address as optional
  start?: number;
  end?: number;
}

const TruncateAddress: React.FC<TruncateAddressProps> = ({
                                                           address = "", // Provide a default empty string if address is undefined
                                                           start = 5,
                                                           end = 5,
                                                         }) => {
  const firstPart = start > 0 ? address.slice(0, start) : '';
  const lastPart = end > 0 ? address.slice(-end) : '';

  // Determine when to truncate
  const shouldTruncate = address.length > start + end;
  const truncatedAddress = shouldTruncate
    ? `${firstPart}...${lastPart}`
    : address;

  return <div>{truncatedAddress}</div>;
};

export default TruncateAddress;
