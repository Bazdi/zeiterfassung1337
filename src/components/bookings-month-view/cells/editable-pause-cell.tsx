/**
 * Editable pause cell component for inline editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { validatePauseMinutes, parseDurationToMinutes } from '../utils/validation';
import { vibrate } from '../utils/time-helpers';

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

    // Call onChange with the string if valid
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
      className={`${className} ${!isValid ? 'border-red-500 focus:border-red-500' : ''} px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
      aria-label={ariaLabel}
      style={style}
    />
  );
}
