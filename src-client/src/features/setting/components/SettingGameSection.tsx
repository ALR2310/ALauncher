import { JAVA_TYPE } from '@shared/dtos/app.dto';
import { useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppGetConfigQuery, useAppSetConfigMutation, useAppSystemInfoQuery } from '~/hooks/api/useAppApi';

export default function SettingGameSection() {
  const queryClient = useQueryClient();
  const { data: systemInfo } = useAppSystemInfoQuery();
  const { data: appConfig } = useAppGetConfigQuery();
  const { mutateAsync: setConfig } = useAppSetConfigMutation();
  const [ram, setRam] = useState<number>(0);

  // Sync ram from config
  useEffect(() => appConfig && setRam(appConfig.minecraft.memory.max), [appConfig]);

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

  const selectedOption = ramOptions.includes(ram) ? ram : 'custom';

  const handleSelectRam = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') return;
    const numeric = Number(val);
    setRam(numeric);
    setConfig({ key: 'minecraft.memory.max', value: numeric });
  };

  const handleInputRam = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const numeric = Number(val);

    const totalMB = systemInfo!.memory.total / 1024 / 1024;
    const limitMB = totalMB * 0.8;
    const safe = Math.min(numeric, limitMB);

    setRam(safe);
    setConfig({ key: 'minecraft.memory.max', value: safe });
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
      setConfig({ key: 'minecraft.gameDir', value: selected }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['instances'] });
        queryClient.invalidateQueries({ queryKey: ['instancesCloud'] });
      });
    }
  };

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

      <label className="label self-start">Force GPU:</label>
      <select
        className="select col-span-2 cursor-pointer"
        value={String(appConfig?.minecraft.forceGPU ?? false)}
        onChange={(e) => setConfig({ key: 'minecraft.forceGPU', value: e.target.value === 'true' })}
      >
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>

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
        <select className="select join-item" value={selectedOption} onChange={handleSelectRam}>
          {ramOptions.map((v) => (
            <option key={v} value={v}>
              {Math.floor(v / 1024)} GB
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>

        <label className="input join-item flex items-center gap-1">
          <input type="text" inputMode="numeric" className="grow" value={ram} onChange={handleInputRam} />
          <span>MB</span>
        </label>
      </div>
    </div>
  );
}
