import { LauncherConfigType } from '@shared/launcher.type';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { fetchVersion, fetchVersionLoader } from '~/services/curseforge';

import { useWS } from '../useWS';

export function useLauncherVersions(configs: LauncherConfigType | null) {
  const { send, on } = useWS();
  const [versionDownloaded, setVersionDownloaded] = useState<string[]>([]);
  const [version, setVersion] = useState('');
  const [versionLoader, setVersionLoader] = useState<string>('');

  useEffect(() => send('version:downloaded'), [send]);
  on('version:downloaded', (data: string[]) => setVersionDownloaded(data ?? []));

  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: fetchVersion,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const baseVersionList = useMemo(() => {
    const raw = (versionQuery.data ?? []) as { versionString: string }[];
    const isSnapshot = (s: string) => s.toLowerCase().includes('snapshot');
    return raw
      .filter((v) => !isSnapshot(v.versionString))
      .map((v) => ({ label: `Release ${v.versionString}`, value: v.versionString }));
  }, [versionQuery.data]);

  const versionList = useMemo(() => {
    if (!baseVersionList.length) return [];
    const downloadedSet = new Set(versionDownloaded);
    return baseVersionList.map((v) => ({ ...v, downloaded: downloadedSet.has(v.value) }));
  }, [baseVersionList, versionDownloaded]);

  useEffect(() => {
    if (!configs || !versionList.length) return;
    const desired = configs.version_selected;

    if (desired === 'latest_release') {
      setVersion(versionList[0].value);
      return;
    }
    const found = versionList.some((v) => v.value === desired);
    setVersion(found ? desired : versionList[0].value);
    setVersionLoader(found ? desired : versionList[0].value);
  }, [configs, versionList]);

  const loaderListQuery = useQuery({
    queryKey: ['loader', versionLoader],
    queryFn: () => fetchVersionLoader({ version: versionLoader }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: !!versionLoader,
  });

  return { version, versionList, setVersionLoader, loaderList: loaderListQuery.data ?? [] };
}
