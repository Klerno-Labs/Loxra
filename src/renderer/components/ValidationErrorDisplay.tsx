import { ValidationIssue } from '@shared/types';
import { twMerge } from 'tailwind-merge';

interface ValidationErrorDisplayProps {
  errors: ValidationIssue[];
  className?: string;
}

export function ValidationErrorDisplay({ errors, className }: ValidationErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className={twMerge('space-y-2', className)}>
      {errors.map((error, idx) => (
        <div
          key={idx}
          className={twMerge(
            'p-3 rounded-lg border',
            error.severity === 'warning'
              ? 'border-yellow-500/50 bg-yellow-500/10'
              : 'border-red-500/50 bg-red-500/10'
          )}
        >
          <div className="flex items-start gap-2">
            <span
              className={twMerge(
                'status-dot mt-1 flex-shrink-0',
                error.severity === 'warning' ? 'bg-yellow-500' : 'danger'
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-200 break-words">
                {error.message}
              </p>
              
              {(error.line || error.column || error.xpath) && (
                <div className="mt-2 space-y-1 text-xs">
                  {error.line && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span>
                        Line {error.line}{error.column ? `, Column ${error.column}` : ''}
                      </span>
                    </div>
                  )}
                  
                  {error.xpath && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <code className="text-xs bg-slate-800/50 px-1 py-0.5 rounded break-all">
                        {error.xpath}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {error.suggestion && (
                <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <svg className="w-3 h-3 mt-0.5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-cyan-300 mb-1">Suggestion:</p>
                      <p className="text-slate-300">{error.suggestion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ValidationErrorSummary({ errors }: { errors: ValidationIssue[] }) {
  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.severity !== 'warning').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="flex items-center gap-2 text-yellow-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
