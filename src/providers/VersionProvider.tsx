import { useQuery } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';

import { getVersion } from '~/services/curseforge';

const VersionContext = createContext<{
  version: string;
  setVersion: (v: string) => void;
  versionList: { label: string; value: string }[];
}>(null!);

const VersionProvider = ({ children }) => {
  const [versionList, setVersionList] = useState<{ label: string; value: string }[]>([]);
  const [version, setVersion] = useState('1.21.1');

  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });

  useEffect(() => {
    if (versionQuery.isLoading) return;

    setVersionList(versionQuery.data.map((v: any) => ({ label: v.versionString, value: v.versionString })));
  }, [versionQuery.data, versionQuery.isLoading]);

  return <VersionContext.Provider value={{ version, setVersion, versionList }}>{children}</VersionContext.Provider>;
};

export { VersionContext, VersionProvider };
