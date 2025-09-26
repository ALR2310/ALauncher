import { VersionDto } from '@shared/dtos/version.dto';
import { useEffect, useState } from 'react';

import { openFolder } from '~/api/launcher.api';
import Select from '~/components/Select';
import { useLauncher } from '~/hooks/api/useLauncher';
import { useFindAllVersionQuery } from '~/hooks/api/useVersion';
import { toast } from '~/hooks/app/useToast';

interface DockProgressProps {
  progress?: number;
  speed?: string;
  estimated?: string;
}

const DockProgress = ({ progress, speed, estimated }: DockProgressProps) => {
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
};

export default function DockNav() {
  const [currVersion, setCurrVersion] = useState<VersionDto>(null!);

  const { event, config, setConfig, launch, cancel } = useLauncher();
  const { data: versions, isLoading: isLoadingVersions, isError: isErrorVersions } = useFindAllVersionQuery();

  // Sync selected version with config
  useEffect(() => {
    if (isLoadingVersions || !config) return;
    if (isErrorVersions) return toast.error('Failed to load versions');

    if (config.profile_selected.version === 'latest_release') {
      const latestRelease = versions?.find((v) => v.type === 'release');
      if (latestRelease) setCurrVersion(latestRelease);
    } else setCurrVersion(config.profile_selected);
  }, [config, isErrorVersions, isLoadingVersions, versions]);

  return (
    <div id="dock" className="relative flex gap-4 p-3 bg-base-300">
      {(event.isDownloading || event.isVerifying) && (
        <DockProgress progress={event.progress} speed={event.speed} estimated={event.estimated} />
      )}

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
        value={currVersion?.name || ''}
        options={
          versions?.map((v) => ({
            label: v.name,
            value: v.name,
            downloaded: v.downloaded,
          })) || []
        }
        onChange={(v) => {
          const selected = versions?.find((ver) => ver.name === v);
          if (selected) setConfig('profile_selected', selected);
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        onClick={() => {
          if (event.isRunning && !event.isVerifying) cancel();
          else {
            if (!config?.auth.username) return toast.error('Please enter your username');
            if (!currVersion) return toast.error('Please select a version');
            launch();
          }
        }}
      >
        {event.isRunning ? 'Cancel' : 'Play'}
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
