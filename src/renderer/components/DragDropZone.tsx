import { useState, DragEvent } from 'react';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface DragDropZoneProps {
  onFileDrop: (content: string) => void;
  className?: string;
  children?: ReactNode;
}

export function DragDropZone({ 
  onFileDrop, 
  className,
  children 
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const xmlFile = files.find(f => f.name.endsWith('.xml'));

    if (xmlFile) {
      const content = await xmlFile.text();
      onFileDrop(content);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={twMerge(
        'relative border-2 border-dashed rounded-lg transition-all duration-200',
        isDragging
          ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
          : 'border-slate-600 bg-slate-800/30 hover:border-slate-500',
        className
      )}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/20 rounded-lg backdrop-blur-sm z-10">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-cyan-300">Drop XML file here</p>
          </div>
        </div>
      )}
    </div>
  );
}
