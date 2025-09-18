import { VersionDto } from '@shared/dtos/version.dto';
import { useEffect, useRef, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

import Select from '../Select';
import DockProgress from './DockProgress';

export default function DockNav() {
  const [version, setVersion] = useState<VersionDto>(null!);
  const evtRef = useRef<EventSource | null>(null);

  // Launcher context
  const config = useContextSelector(LauncherContext, (v) => v.getConfig());
  const setConfig = useContextSelector(LauncherContext, (v) => v.setConfig);
  const openFolder = useContextSelector(LauncherContext, (v) => v.openFolder);
  const findAllVersionQuery = useContextSelector(LauncherContext, (v) => v.findAllVersionQuery);
  const launch = useContextSelector(LauncherContext, (v) => v.launch);
  const cancel = useContextSelector(LauncherContext, (v) => v.cancel);
  const isDownloading = useContextSelector(LauncherContext, (v) => v.isDownloading);
  const isRunning = useContextSelector(LauncherContext, (v) => v.isRunning);
  const progress = useContextSelector(LauncherContext, (v) => v.event.progress);
  const speed = useContextSelector(LauncherContext, (v) => v.event.speed);
  const estimated = useContextSelector(LauncherContext, (v) => v.event.estimated);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifySpeed, setVerifySpeed] = useState('0 B/s');
  const [verifyEstimated, setVerifyEstimated] = useState('0s');

  // Sync version when config or versions change
  useEffect(() => {
    if (findAllVersionQuery.isLoading || !config) return;
    if (findAllVersionQuery.isError) return toast.error('Failed to fetch versions');

    const versions = findAllVersionQuery.data!;

    if (config.profile_selected.version === 'latest_release') {
      const latestRelease = versions.find((v) => v.type === 'release');
      if (latestRelease) setVersion(latestRelease);
    } else {
      setVersion(config.profile_selected);
    }
  }, [config, findAllVersionQuery.data, findAllVersionQuery.isError, findAllVersionQuery.isLoading]);

  const handleVerify = () => {
    return new Promise<void>((resolve, reject) => {
      const url = `http://localhost:${import.meta.env.VITE_SERVER_PORT ?? 1421}/api/launchers/verify`;
      evtRef.current = new EventSource(url);

      setIsVerifying(true);
      setVerifyProgress(0);
      setVerifySpeed('0 B/s');
      setVerifyEstimated('0s');

      evtRef.current.addEventListener('progress', (e) => {
        setVerifyProgress(parseFloat(e.data));
      });
      evtRef.current.addEventListener('speed', (e) => {
        setVerifySpeed(e.data);
      });
      evtRef.current.addEventListener('estimated', (e) => {
        setVerifyEstimated(e.data);
      });
      evtRef.current.addEventListener('done', () => {
        setIsVerifying(false);
        setVerifyProgress(100);
        evtRef?.current?.close();
        resolve();
      });
      evtRef.current.addEventListener('error', () => {
        setIsVerifying(false);
        setVerifyProgress(0);
        toast.error('Failed to verify. Please try again.');
        evtRef?.current?.close();
        reject(new Error('Verification failed'));
      });
    });
  };

  return (
    <div id="dockNav" className="relative flex gap-4 p-3 bg-base-300">
      {isDownloading && <DockProgress progress={progress} speed={speed} estimated={estimated} />}
      {isVerifying && <DockProgress progress={verifyProgress} speed={verifySpeed} estimated={verifyEstimated} />}

      <label className="input flex-1">
        <i className="fa-light fa-user"></i>
        <input
          type="text"
          className="grow"
          placeholder="Username"
          value={config?.auth.username || ''}
          onChange={(e) => {
            setConfig('auth.username', e.target.value);
          }}
        />
      </label>

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={version?.name || ''}
        options={
          findAllVersionQuery.data?.map((v) => ({
            label: v.name,
            value: v.name,
            downloaded: v.downloaded,
          })) || []
        }
        onChange={(v) => {
          const selected = findAllVersionQuery.data?.find((ver) => ver.name === v);
          if (selected) setConfig('profile_selected', selected);
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        onClick={async () => {
          if (isRunning) {
            cancel();
          } else {
            if (!config?.auth.username) return toast.warning('Please enter your username');
            if (!version) return toast.warning('Please select a version');

            try {
              await handleVerify();
              launch();
            } catch (error) {
              console.error('Verification failed:', error);
            }
          }
        }}
      >
        {isRunning ? 'Cancel' : 'Play'}
      </button>

      <div className="flex-1 flex">
        <button className="btn btn-ghost flex-1" onClick={() => window.location.reload()}>
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button className="btn btn-ghost flex-1" onClick={openFolder}>
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
