import { useEffect, useState } from 'react';

export default function LoadingPage() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center skeleton">
      <div className="flex">
        <span className="text-xl font-semibold animate-pulse">Loading Library{dots}</span>
      </div>
      <progress className="progress progress-no-rounded w-[50%]"></progress>
    </div>
  );
}
