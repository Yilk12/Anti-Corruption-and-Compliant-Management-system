import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Search, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/backend/lib/utils";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";

export interface EnhancedTextInputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'textarea' | 'number';
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoResize?: boolean;
  showCharacterCount?: boolean;
  showPasswordToggle?: boolean;
  showClearButton?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  className?: string;
  inputClassName?: string;
  rows?: number;
  cols?: number;
}

const EnhancedTextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, EnhancedTextInputProps>(
  ({
    type = 'text',
    value = '',
    onChange,
    onBlur,
    onFocus,
    placeholder,
    label,
    helperText,
    error,
    success,
    disabled = false,
    required = false,
    maxLength,
    minLength,
    autoResize = false,
    showCharacterCount = false,
    showPasswordToggle = false,
    showClearButton = false,
    icon,
    iconPosition = 'left',
    size = 'md',
    variant = 'default',
    className,
    inputClassName,
    rows = 3,
    cols,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use the forwarded ref or internal ref
    const actualRef = ref || (type === 'textarea' ? textareaRef : inputRef);

    // Update internal value when external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Auto-resize for textarea
    useEffect(() => {
      if (type === 'textarea' && autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [internalValue, type, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.();
    };

    const handleClear = () => {
      setInternalValue('');
      onChange?.('');
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-base',
      lg: 'h-12 text-lg'
    };

    // Variant classes
    const variantClasses = {
      default: 'border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      filled: 'bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-200',
      outlined: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-0'
    };

    // Status classes
    const statusClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
      : success 
      ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
      : '';

    const inputClasses = cn(
      'w-full rounded-md transition-all duration-200',
      sizeClasses[size],
      variantClasses[variant],
      statusClasses,
      disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
      inputClassName
    );

    const isTextarea = type === 'textarea';
    const inputType = type === 'password' && showPassword ? 'text' : type;

    const renderInput = () => {
      if (isTextarea) {
        return (
          <Textarea
            ref={actualRef as React.Ref<HTMLTextAreaElement>}
            value={internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            rows={rows}
            cols={cols}
            className={cn(inputClasses, autoResize && 'resize-none')}
            {...props}
          />
        );
      }

      return (
        <Input
          ref={actualRef as React.Ref<HTMLInputElement>}
          type={inputType}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          className={inputClasses}
          {...props}
        />
      );
    };

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {/* Input field */}
          <div className={cn(
            'relative',
            icon && iconPosition === 'left' && 'pl-10',
            (icon && iconPosition === 'right') || showPasswordToggle || showClearButton ? 'pr-10' : ''
          )}>
            {renderInput()}
          </div>

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Clear button */}
            {showClearButton && internalValue && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            )}

            {/* Password toggle */}
            {showPasswordToggle && type === 'password' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={togglePasswordVisibility}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}

            {/* Right icon */}
            {icon && iconPosition === 'right' && (
              <div className="text-gray-400">
                {icon}
              </div>
            )}

            {/* Status icons */}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            {success && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        </div>

        {/* Helper text and character count */}
        <div className="mt-1 flex justify-between items-start">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            
            {/* Success message */}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {success}
              </p>
            )}
            
            {/* Helper text */}
            {helperText && !error && !success && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>

          {/* Character count */}
          {showCharacterCount && maxLength && (
            <span className={cn(
              'text-xs ml-2',
              internalValue.length > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'
            )}>
              {internalValue.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

EnhancedTextInput.displayName = 'EnhancedTextInput';

export { EnhancedTextInput };

