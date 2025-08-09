import { useQuery } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';

import { useWS } from '~/hook/useWS';
import { getVersion } from '~/services/curseforge';

const VersionContext = createContext<{
  version: string;
  setVersion: (v: string) => void;
  versionList: { label: string; value: string }[];
}>(null!);

const VersionProvider = ({ children }) => {
  const { send, on } = useWS();
  const [versionList, setVersionList] = useState<{ label: string; value: string }[]>([]);
  const [version, setVersion] = useState('');

  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });

  send('appConfig');
  on('appConfig', (data) => {
    if (versionList.length === 0) return;

    if (data.version_selected === 'latest') {
      setVersion(versionList[0].value);
    } else {
      setVersion(data.version_selected);
    }
  });

  useEffect(() => {
    if (versionQuery.isLoading) return;

    setVersionList(versionQuery.data.map((v: any) => ({ label: v.versionString, value: v.versionString })));
  }, [versionQuery.data, versionQuery.isLoading]);

  return <VersionContext.Provider value={{ version, setVersion, versionList }}>{children}</VersionContext.Provider>;
};

export { VersionContext, VersionProvider };
