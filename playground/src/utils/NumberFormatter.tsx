import React from 'react';

interface NumberFormatterProps {
  value: number;
  addCommas?: boolean;
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
  useLetterNotation?: boolean;
  maxLength?: number;
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
  } = {}
): string => {
  const { addCommas = false, minDecimalPlaces = 0, maxDecimalPlaces = 20, useLetterNotation = false, maxLength } = options;

  let formattedNumber = number;
  let letterNotation = '';

  // Handle letter notation first
  if (useLetterNotation) {
    const units = ['', 'k', 'M', 'B', 'T'];
    const order = Math.floor(Math.log10(Math.abs(formattedNumber)) / 3);
    if (order > 0) {
      formattedNumber = formattedNumber / Math.pow(10, order * 3);
      letterNotation = units[Math.min(order, units.length - 1)];
    }
  }

  // Calculate available length for the number itself
  const availableLength = maxLength !== undefined ? maxLength - letterNotation.length : Infinity;

  // Ensure at least one digit is shown before the decimal point
  const integerDigits = Math.max(1, Math.floor(Math.log10(Math.abs(formattedNumber)) + 1));

  // Calculate the number of decimal places we can show given the constraints
  let decimalPlaces = Math.min(
    maxDecimalPlaces,
    Math.max(minDecimalPlaces, availableLength - integerDigits - (minDecimalPlaces > 0 ? 1 : 0))
  );

  // Format the number with the calculated decimal places
  let result = formattedNumber.toFixed(decimalPlaces);

  // Add commas if needed
  if (addCommas) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  // Add the letter notation after formatting the number
  result += letterNotation;

  // If the result exceeds maxLength, consider reducing decimal places further
  if (maxLength !== undefined && result.length > maxLength) {
    const excessLength = result.length - maxLength;

    // Calculate how many decimal places we can trim to fit maxLength
    decimalPlaces = Math.max(0, decimalPlaces - excessLength);
    result = formattedNumber.toFixed(decimalPlaces) + letterNotation;

    // Add commas again if needed after adjusting decimal places
    if (addCommas) {
      const parts = result.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result = parts.join('.');
    }
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
                                                           className = '',
                                                         }) => {
  const formattedNumber = formatNumber(value, {
    addCommas,
    minDecimalPlaces,
    maxDecimalPlaces,
    useLetterNotation,
    maxLength,
  });

  return <span className={className}>{formattedNumber}</span>;
};

export default NumberFormatter;
