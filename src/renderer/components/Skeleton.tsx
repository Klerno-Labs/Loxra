import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({ 
  className, 
  variant = 'text', 
  width, 
  height,
  count = 1 
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-slate-700/50';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const skeletonElement = (
    <div
      className={twMerge(
        baseClass,
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{skeletonElement}</div>
        ))}
      </div>
    );
  }

  return skeletonElement;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton variant="rectangular" height="40px" className="w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="rectangular" width="20%" height="32px" />
          <Skeleton variant="rectangular" width="30%" height="32px" />
          <Skeleton variant="rectangular" width="40%" height="32px" />
          <Skeleton variant="rectangular" width="10%" height="32px" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-slate-800/30 rounded-lg border border-slate-700">
          <Skeleton variant="rectangular" height="24px" width="60%" className="mb-4" />
          <Skeleton variant="text" count={3} />
          <div className="mt-4 flex gap-2">
            <Skeleton variant="rectangular" height="36px" width="100px" />
            <Skeleton variant="rectangular" height="36px" width="100px" />
          </div>
        </div>
      ))}
    </div>
  );
}
