import { ValidationResult } from '@shared/types';

export function ValidationPill({ validation }: { validation: ValidationResult }) {
  if (!validation) return null;
  const color = validation.valid ? 'chip chip-success' : 'chip chip-danger';
  const label = validation.valid ? 'Valid' : 'Invalid';
  return (
    <span className={`${color}`}>
      <span className={`status-dot ${validation.valid ? 'success' : 'danger'}`} />
      {label}
    </span>
  );
}
