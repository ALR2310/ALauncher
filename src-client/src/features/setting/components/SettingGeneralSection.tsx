import { useMemo } from 'react';

import Tooltip from '~/components/Tooltip';
import { THEME } from '~/context/ThemeContext';
import { useAppGetConfigQuery, useAppSetConfigMutation, useAppSystemInfoQuery } from '~/hooks/api/useAppApi';
import { useTheme } from '~/hooks/app/useTheme';

export default function SettingGeneralSection() {
  const { data: systemInfo } = useAppSystemInfoQuery();
  const { data: appConfig } = useAppGetConfigQuery();
  const { mutateAsync: setConfig } = useAppSetConfigMutation();
  const { theme, setTheme } = useTheme();

  const themes = useMemo(() => Object.values(THEME), []);

  const downloadMultipleOptions = useMemo(() => {
    if (!systemInfo) return [];

    const options: number[] = [];
    const cpuCores = systemInfo.cpu.cores;
    const estimated = Math.floor(cpuCores * 0.7);
    const maxDownloads = Math.min(10, Math.max(1, estimated));

    for (let i = 1; i <= maxDownloads; i++) {
      options.push(i);
    }

    return options;
  }, [systemInfo]);

  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <Tooltip content="Choose the visual style of the application">
        <label className="label">Theme:</label>
      </Tooltip>
      <select className="select col-span-2" value={theme} onChange={(e) => setTheme(e.target.value as THEME)}>
        {themes.map((t) => (
          <option key={t} value={t} className="capitalize">
            {t}
          </option>
        ))}
      </select>

      <Tooltip content="Select the language for the interface">
        <label className="label">Language:</label>
      </Tooltip>
      <select
        className="select col-span-2"
        value={appConfig?.language}
        onChange={(e) => setConfig({ key: 'language', value: e.target.value })}
      >
        <option value="en">English</option>
        <option value="vi" disabled>
          Vietnamese
        </option>
      </select>

      <Tooltip content="Automatically update the application when new versions are available">
        <label className="label">Auto Update:</label>
      </Tooltip>
      <select
        className="select col-span-2"
        value={appConfig?.autoUpdate ? 'true' : 'false'}
        onChange={(e) => setConfig({ key: 'autoUpdate', value: e.target.value === 'true' })}
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>

      <Tooltip content="Number of simultaneous downloads">
        <label className="label">Concurrency:</label>
      </Tooltip>
      <select
        className="select col-span-2"
        value={appConfig?.downloadMultiple}
        onChange={(e) => setConfig({ key: 'downloadMultiple', value: Number(e.target.value) })}
      >
        {downloadMultipleOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <Tooltip content="Hide the launcher window when launching a game">
        <label className="label">Hidden Launcher:</label>
      </Tooltip>
      <select
        className="select col-span-2"
        value={appConfig?.hiddenLauncher ? 'true' : 'false'}
        onChange={(e) => setConfig({ key: 'hiddenLauncher', value: e.target.value === 'true' })}
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    </div>
  );
}
