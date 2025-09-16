/**
 * Editable pause cell component for inline editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { validatePauseMinutes, parseDurationToMinutes } from '../utils/validation';

interface EditablePauseCellProps {
  value: string;
  onSave: (newValue: number) => Promise<void>;
  onCancel: () => void;
  onChange?: (newValue: string) => void;
  className?: string;
  'aria-label'?: string;
  style?: React.CSSProperties;
  shouldFocus?: boolean;
}

export function EditablePauseCell({
  value,
  onSave,
  onCancel,
  onChange,
  className = 'w-[110px] h-10',
  'aria-label': ariaLabel,
  style,
  shouldFocus = false
}: EditablePauseCellProps) {
  const [editValue, setEditValue] = useState(String(value));
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(String(value));
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
    const validation = validatePauseMinutes(editValue);
    setIsValid(validation.isValid);

    if (validation.isValid) {
      const newValue = parseDurationToMinutes(editValue);
      try {
        await onSave(newValue);
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

    // Call onChange with parsed minutes if valid
    if (onChange && validation.isValid) {
      onChange(newValue);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="MM oder HH:MM"
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
