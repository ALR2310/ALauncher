interface DockProgressProps {
  progress?: number;
  speed?: string;
  estimated?: string;
}

export default function DockProgress({ progress, speed, estimated }: DockProgressProps) {
  return (
    <div className="absolute left-0 bottom-[90%] w-full">
      <p className="absolute left-1/2 text-primary font-semibold z-10">
        {progress && progress < 100 ? `${progress}% - ${speed} - ${estimated}` : undefined}
      </p>
      <progress
        className="progress h-3 progress-no-rounded"
        value={progress && progress < 100 ? progress : undefined}
        max="100"
      ></progress>
    </div>
  );
}
