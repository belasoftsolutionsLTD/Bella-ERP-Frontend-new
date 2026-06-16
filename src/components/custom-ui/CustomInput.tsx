'use client';

import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type InputComponent =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'date'
  | 'select'
  | 'file';

interface SelectOption {
  label: string;
  value: string;
}

interface CustomInputProps<T extends FieldValues> {
  component: InputComponent;
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  options?: SelectOption[];
  className?: string;
  selectTriggerClassName?: string;
  selectItemClassName?: string;
}

export function CustomInput<T extends FieldValues>({
  component,
  name,
  control,
  label,
  placeholder,
  options = [],
  className,
  selectTriggerClassName,
  selectItemClassName,
}: CustomInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label htmlFor={String(name)}>{label}</Label>

          {component === 'textarea' && (
            <Textarea
              {...field}
              id={String(name)}
              placeholder={placeholder}
              className={cn(fieldState.error && 'border-danger')}
            />
          )}

          {component === 'select' && (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger
                id={String(name)}
                className={cn(fieldState.error && 'border-danger', field.value && selectTriggerClassName)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className={selectItemClassName}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {component === 'file' && (
            <Input
              id={String(name)}
              type="file"
              className={cn(fieldState.error && 'border-danger')}
              onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
            />
          )}

          {!['textarea', 'select', 'file'].includes(component) && (
            <Input
              {...field}
              id={String(name)}
              type={component}
              placeholder={placeholder}
              className={cn(fieldState.error && 'border-danger')}
            />
          )}

          {fieldState.error && (
            <p className="text-xs text-danger">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
