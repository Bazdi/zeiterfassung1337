/**
 * Editable pause cell component for inline editing
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { validatePauseMinutes } from '../utils/validation';
import { vibrate } from '../utils/time-helpers';

interface EditablePauseCellProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  onCancel: () => void;
  className?: string;
  'aria-label'?: string;
}

export function EditablePauseCell({
  value,
  onSave,
  onCancel,
  className = 'w-[110px] h-10',
  'aria-label': ariaLabel
}: EditablePauseCellProps) {
  const [editValue, setEditValue] = useState(String(value));
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleSave = async () => {
    const validation = validatePauseMinutes(editValue);
    setIsValid(validation.isValid);

    if (validation.isValid) {
      const newValue = parseInt(editValue, 10) || 0;
      try {
        await onSave(newValue);
        vibrate(10);
      } catch (error) {
        console.error('Failed to save pause:', error);
        setIsValid(false);
      }
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsValid(true);
    onCancel();
  };

  const handleBlur = () => {
    // Auto-save on blur if valid
    if (isValid && editValue !== String(value)) {
      handleSave();
    } else {
      handleCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    // Real-time validation
    const validation = validatePauseMinutes(newValue);
    setIsValid(validation.isValid || newValue === '');
  };

  return (
    <Input
      type="number"
      min={0}
      step={5}
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="0"
      className={`${className} ${!isValid ? 'border-red-500 focus:border-red-500' : ''}`}
      aria-label={ariaLabel}
      autoFocus
    />
  );
}