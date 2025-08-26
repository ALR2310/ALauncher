import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Select from '~/components/Select';
import { api } from '~/configs/axios';
import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherLifecycle } from '~/hooks/launcher/useLauncherLifecycle';
import { useLauncherVersion } from '~/hooks/launcher/useLauncherVersions';
import { toast } from '~/hooks/useToast';

export default function DockNav() {
  const [username, setUsername] = useState('');
  const [versionSelected, setVersionSelected] = useState('');
  const navigate = useNavigate();

  // Launcher state
  const { getConfig, setConfig } = useLauncherConfig();
  const { getVersions } = useLauncherVersion();
  const { launch, cancel, progress, speed, estimated, isRunning, isDownloading } = useLauncherLifecycle();

  const config = getConfig.data;
  const versions = getVersions.data;

  // Set initial username from config
  useEffect(() => {
    if (config) setUsername(config.username);
  }, [config]);

  // Set initial version selected from config
  useEffect(() => {
    if (!config || !versions) return;
    if (config.version_selected.version === 'latest_release') {
      setVersionSelected(versions[0].version);
    } else setVersionSelected(config.version_selected.version);
  }, [config, versions]);

  return (
    <div id="dockNavbar" className="relative flex flex-nowrap gap-4 p-3 bg-base-300">
      {isDownloading && (
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
      )}

      <label className="input flex-1">
        <i className="fa-light fa-user"></i>
        <input
          type="text"
          className="grow"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setConfig.mutateAsync({ key: 'username', value: e.target.value }).then(() => getConfig.refetch());
          }}
        />
      </label>

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={versionSelected}
        options={
          versions?.map((v) => ({
            label: v.name,
            value: v.version,
            downloaded: v.downloaded,
            type: v.type,
          })) ?? []
        }
        onChange={(value, data) => {
          setConfig
            .mutateAsync({
              key: 'version_selected',
              value: {
                name: versions?.find((v) => v.version === value)?.name || 'Unknown',
                version: value,
                type: versions?.find((v) => v.version === value)?.type || 'release',
              },
            })
            .then(() => {
              getConfig.refetch();
              if (data.type !== 'release') navigate('manager');
              else navigate('/');
            });
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        onClick={() => {
          if (!username) return toast.warning('Please enter your username');
          if (!isRunning) {
            launch();
          } else cancel();
        }}
      >
        {isRunning ? 'Cancel' : 'Play'}
      </button>

      <div className="flex-1 flex">
        <button
          className="btn btn-ghost flex-1"
          onClick={() => {
            window.location.reload();
          }}
        >
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button
          className="btn btn-ghost flex-1"
          onClick={() => {
            api.get('launcher/openFolder');
          }}
        >
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
