import { useEffect, useState } from 'react';

export default function SplashScreen({ progress }: { progress?: number }) {
  const [dots, setDots] = useState('');
  const [text, setText] = useState('Loading Library');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress !== undefined) {
      setText('Updating');
    }
  }, [progress]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center skeleton">
      <div className="flex">
        <span className="text-xl font-semibold animate-pulse">{`${text}${dots}`}</span>
      </div>
      <progress className="progress progress-no-rounded w-[50%]" value={progress} max={100}></progress>
    </div>
  );
}
