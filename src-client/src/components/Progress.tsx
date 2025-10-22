interface ProgressProps {
  className?: string;
  text?: string;
  value?: number;
}

export default function Progress({ className, text, value }: ProgressProps) {
  return (
    <div className={`relative ${className}`}>
      <progress className="progress progress-success w-full h-full" value={value} max={100} />
      <div className="flex flex-col justify-center items-center absolute text-base-content text-center text-sm inset-0">
        <p>{text}</p>
      </div>
    </div>
  );
}
