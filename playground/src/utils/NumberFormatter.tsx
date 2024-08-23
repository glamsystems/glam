import React from 'react';

interface NumberFormatterProps {
  value: number;
  addCommas?: boolean;
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
  useLetterNotation?: boolean;
  maxLength?: number;
  isPercentage?: boolean;
  className?: string;
}

const formatNumber = (
  number: number,
  options: {
    addCommas?: boolean;
    minDecimalPlaces?: number;
    maxDecimalPlaces?: number;
    useLetterNotation?: boolean;
    maxLength?: number;
    isPercentage?: boolean;
  } = {}
): string => {
  const { addCommas = false, minDecimalPlaces = 0, maxDecimalPlaces = 20, useLetterNotation = false, maxLength, isPercentage = false } = options;

  let formattedNumber = number;
  let letterNotation = '';
  let percentageSymbol = '';

  // Handle percentage formatting
  if (isPercentage) {
    formattedNumber *= 100;
    percentageSymbol = '%';
  }

  // Handle letter notation first
  if (useLetterNotation) {
    const units = ['', 'k', 'M', 'B', 'T'];
    const order = Math.floor(Math.log10(Math.abs(formattedNumber)) / 3);
    if (order > 0) {
      formattedNumber = formattedNumber / Math.pow(10, order * 3);
      letterNotation = units[Math.min(order, units.length - 1)];
    }
  }

  // Format the number with the calculated decimal places
  const decimalPlaces = Math.min(
    maxDecimalPlaces,
    Math.max(minDecimalPlaces, maxDecimalPlaces)
  );

  let result = formattedNumber.toFixed(decimalPlaces);

  // Add commas if needed
  if (addCommas) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  // Add the letter notation after formatting the number
  result += letterNotation;

  // Append percentage symbol if applicable
  result += percentageSymbol;

  // If the result exceeds maxLength, trim the result appropriately
  if (maxLength !== undefined && result.length > maxLength) {
    // Account for the length of letter notation and percentage symbol
    const nonNumericLength = letterNotation.length + percentageSymbol.length;

    // Calculate the number of allowed characters for the numeric part
    const allowedLength = maxLength - nonNumericLength;

    // Trim the numeric part of the result to fit within the allowed length
    const trimmedResult = result.slice(0, allowedLength);

    // If we trimmed the decimal places, we may need to adjust them
    const decimalPointIndex = trimmedResult.indexOf('.');
    if (decimalPointIndex !== -1) {
      const integerPart = trimmedResult.slice(0, decimalPointIndex);
      const decimalPart = trimmedResult.slice(decimalPointIndex + 1);

      // If the trimmed decimal part is shorter than minDecimalPlaces, pad it with zeros
      result = `${integerPart}.${decimalPart.padEnd(minDecimalPlaces, '0')}`;
    } else {
      result = trimmedResult;
    }

    // Reappend the letter notation and percentage symbol
    result += letterNotation + percentageSymbol;
  }

  return result;
}

const NumberFormatter: React.FC<NumberFormatterProps> = ({
                                                           value,
                                                           addCommas = false,
                                                           minDecimalPlaces,
                                                           maxDecimalPlaces,
                                                           useLetterNotation = false,
                                                           maxLength,
                                                           isPercentage = false,
                                                           className = '',
                                                         }) => {
  const formattedNumber = formatNumber(value, {
    addCommas,
    minDecimalPlaces,
    maxDecimalPlaces,
    useLetterNotation,
    maxLength,
    isPercentage,
  });

  return <span className={className}>{formattedNumber}</span>;
};

export default NumberFormatter;
