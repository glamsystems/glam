import React from 'react';

interface TruncateAddressProps {
  address: string;
}

const TruncateAddress: React.FC<TruncateAddressProps> = ({ address }) => {
  const firstPart = address.slice(0, 5);
  const lastPart = address.slice(-5);

  // Determine when to truncate
  const shouldTruncate = address.length > 10;
  const truncatedAddress = shouldTruncate ? `${firstPart}...${lastPart}` : address;

  return (
    <div>
      {truncatedAddress}
    </div>
  );
};

export default TruncateAddress;