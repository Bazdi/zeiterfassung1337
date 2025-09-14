/**
 * Editable time cell component for inline editing
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { validateTimeString } from '../utils/validation';
import { vibrate } from '../utils/time-helpers';

interface EditableTimeCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  onChange?: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export function EditableTimeCell({
  value,
  onSave,
  onCancel,
  onChange,
  placeholder = 'HH:MM',
  className = 'w-[120px] h-10',
  'aria-label': ariaLabel
}: EditableTimeCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setEditValue(value);
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
    const validation = validateTimeString(editValue);
    setIsValid(validation.isValid);

    if (validation.isValid) {
      try {
        await onSave(editValue);
        vibrate(10);
      } catch (error) {
        console.error('Failed to save time:', error);
        setIsValid(false);
      }
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsValid(true);
    onCancel();
  };

  const handleBlur = () => {
    // Auto-save on blur if valid
    if (isValid && editValue !== value) {
      handleSave();
    } else {
      handleCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    // Real-time validation
    const validation = validateTimeString(newValue);
    setIsValid(validation.isValid || newValue === '');
    onChange?.(newValue);
  };

  return (
    <Input
      type="time"
      step={300} // 5-minute steps
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`${className} ${!isValid ? 'border-red-500 focus:border-red-500' : ''}`}
      aria-label={ariaLabel}
      autoFocus
    />
  );
}
