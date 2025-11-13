import { JAVA_TYPE } from '@shared/dtos/app.dto';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppGetConfigQuery, useAppSetConfigMutation, useAppSystemInfoQuery } from '~/hooks/api/useAppApi';

export default function SettingGameSection() {
  const { data: systemInfo } = useAppSystemInfoQuery();
  const { data: appConfig } = useAppGetConfigQuery();
  const { mutateAsync: setConfig } = useAppSetConfigMutation();

  const [customRam, setCustomRam] = useState('');

  useEffect(() => {
    if (appConfig?.minecraft.memory.max) {
      setCustomRam(String(appConfig.minecraft.memory.max));
    }
  }, [appConfig]);

  const ramOptions = useMemo(() => {
    if (!systemInfo) return [];

    const totalMB = systemInfo.memory.total / (1024 * 1024);
    const totalGB = totalMB / 1024;
    const limitGB = Math.floor(totalGB * 0.8);

    let step = 1;
    if (totalGB > 16) step = 2;
    if (totalGB > 32) step = 4;

    const options: number[] = [];
    for (let gb = 1; gb <= limitGB; gb += step) {
      options.push(gb * 1024);
    }
    return options;
  }, [systemInfo]);

  const handleCustomRamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!systemInfo) return;

    const totalMB = systemInfo.memory.total / (1024 * 1024);
    const limitMB = totalMB * 0.8;
    const numeric = Number(val);

    if (val === '' || numeric === 0) {
      setCustomRam('1024');
      setConfig({ key: 'minecraft.memory.max', value: 1024 });
    } else if (numeric <= limitMB) {
      setCustomRam(val);
      setConfig({ key: 'minecraft.memory.max', value: numeric });
    }
  };

  const handleChooseGameDir = async () => {
    if (!window.isTauri) return toast.warning('This feature is only available in the desktop application.');

    const selected = await open({
      defaultPath: appConfig?.minecraft.gameDir,
      directory: true,
      multiple: false,
      title: 'Select Game Location',
    });

    if (selected) {
      setConfig({ key: 'minecraft.gameDir', value: selected });
    }
  };

  const currentRam = appConfig?.minecraft.memory.max ?? 0;

  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <label className="label">Game Location:</label>
      <input
        type="text"
        className="input cursor-pointer col-span-2"
        value={appConfig?.minecraft.gameDir ?? ''}
        readOnly
        onClick={handleChooseGameDir}
      />

      <label className="label self-start">Screen:</label>
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <label className="label">Width:</label>
        <input
          type="number"
          className="input col-span-2"
          value={appConfig?.minecraft.screen.width ?? ''}
          onChange={(e) => setConfig({ key: 'minecraft.screen.width', value: Number(e.target.value) })}
        />

        <label className="label">Height:</label>
        <input
          type="number"
          className="input col-span-2"
          value={appConfig?.minecraft.screen.height ?? ''}
          onChange={(e) => setConfig({ key: 'minecraft.screen.height', value: Number(e.target.value) })}
        />

        <label className="label">Fullscreen:</label>
        <select
          className="select cursor-pointer col-span-2"
          value={String(appConfig?.minecraft.screen.fullscreen ?? false)}
          onChange={(e) => setConfig({ key: 'minecraft.screen.fullscreen', value: e.target.value === 'true' })}
        >
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      </div>

      <label className="label self-start">JAVA:</label>
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <label className="label">Type:</label>
        <select
          className="select col-span-2"
          onChange={(e) => setConfig({ key: 'minecraft.java.type', value: e.target.value })}
        >
          {Object.values(JAVA_TYPE).map((type) => (
            <option key={type} value={type} className="capitalize">
              {type}
            </option>
          ))}
        </select>

        <label className="label">Version:</label>
        <input type="number" className="input col-span-2" placeholder="Default" readOnly />

        <label className="label">Path:</label>
        <input type="text" className="input col-span-2" placeholder="Default" readOnly />
      </div>

      <label className="label">RAM:</label>
      <div className="join col-span-2">
        <select
          className="select join-item"
          value={ramOptions.includes(currentRam) ? currentRam : 'custom'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') return;
            setCustomRam(val);
            setConfig({ key: 'minecraft.memory.max', value: Number(val) });
          }}
        >
          {ramOptions.map((v) => (
            <option key={v} value={v}>
              {Math.floor(v / 1024)} GB
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>

        <label className="input join-item flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            className="grow"
            value={customRam}
            onChange={handleCustomRamChange}
            placeholder="custom"
          />
          <span>MB</span>
        </label>
      </div>
    </div>
  );
}
