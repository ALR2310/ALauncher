import React from 'react';

interface ProgressProps {
  className?: string;
  text?: React.ReactNode;
  value?: number;
}

export default function Progress({ className, text, value }: ProgressProps) {
  return (
    <div className={`relative ${className}`}>
      <progress className="progress progress-success w-full h-full rounded" value={value} max={100} />
      <div className="flex flex-col justify-center items-center absolute text-base-content text-center text-sm inset-0">
        {text}
      </div>
    </div>
  );
}
