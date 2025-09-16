/**
 * Editable time cell component for inline editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { validateTimeString } from '../utils/validation';

interface EditableTimeCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  onChange?: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  style?: React.CSSProperties;
  shouldFocus?: boolean;
}

export function EditableTimeCell({
  value,
  onSave,
  onCancel,
  onChange,
  placeholder = 'HH:MM',
  className = 'w-[120px] h-10',
  'aria-label': ariaLabel,
  style,
  shouldFocus = false
}: EditableTimeCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [shouldFocus]);

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
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        className,
        'rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-muted-foreground',
        !isValid && 'border-destructive text-destructive focus-visible:ring-destructive'
      )}
      aria-label={ariaLabel}
      style={style}
    />
  );
}
