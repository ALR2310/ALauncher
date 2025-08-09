import { createContext, useState } from 'react';

const VersionContext = createContext<{ version: string; setVersion: (v: string) => void }>(null!);

const VersionProvider = ({ children }) => {
  const [version, setVersion] = useState('1.21.1');
  return <VersionContext.Provider value={{ version, setVersion }}>{children}</VersionContext.Provider>;
};

export { VersionContext, VersionProvider };
