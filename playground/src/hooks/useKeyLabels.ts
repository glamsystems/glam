import { useState, useEffect } from 'react';

interface KeyLabel {
  pubkey: string;
  label: string;
}

export function useKeyLabels() {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load labels from localStorage on mount
    const storedLabels = localStorage.getItem('keyLabels');
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels));
    }
  }, []);

  const updateLabel = (pubkey: string, label: string) => {
    const newLabels = { ...labels, [pubkey]: label };
    setLabels(newLabels);
    localStorage.setItem('keyLabels', JSON.stringify(newLabels));
  };

  const getLabel = (pubkey: string) => {
    return labels[pubkey] || '-';
  };

  return {
    labels,
    updateLabel,
    getLabel,
  };
}
