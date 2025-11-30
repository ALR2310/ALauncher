import { JAVA_TYPE } from '@shared/dtos/app.dto';
import { useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import Tooltip from '~/components/Tooltip';
import { useAppGetConfigQuery, useAppSetConfigMutation, useAppSystemInfoQuery } from '~/hooks/api/useAppApi';

const SCREEN_PRESETS = [
  { label: '854 x 480', width: 854, height: 480 },
  { label: '1280 x 720', width: 1280, height: 720 },
  { label: '1366 x 768', width: 1366, height: 768 },
  { label: '1600 x 900', width: 1600, height: 900 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
  { label: '2560 x 1440', width: 2560, height: 1440 },
  { label: '3840 x 2160', width: 3840, height: 2160 },
];

export default function SettingGameSection() {
  const queryClient = useQueryClient();
  const { data: systemInfo } = useAppSystemInfoQuery();
  const { data: appConfig } = useAppGetConfigQuery();
  const { mutateAsync: setConfig } = useAppSetConfigMutation();
  const [ram, setRam] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [screenHeight, setScreenHeight] = useState<number>(0);

  // Sync config
  useEffect(() => {
    if (appConfig) {
      setRam(appConfig.minecraft.memory.max);
      setScreenWidth(appConfig.minecraft.screen.width ?? 1920);
      setScreenHeight(appConfig.minecraft.screen.height ?? 1080);
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

  const selectedOption = ramOptions.includes(ram) ? ram : 'custom';

  const selectedScreenPreset = useMemo(() => {
    return (
      SCREEN_PRESETS.find((preset) => preset.width === screenWidth && preset.height === screenHeight)?.label || 'custom'
    );
  }, [screenWidth, screenHeight]);

  const handleSelectScreenPreset = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') return;

    const preset = SCREEN_PRESETS.find((p) => p.label === val);
    if (preset) {
      setScreenWidth(preset.width);
      setScreenHeight(preset.height);
      try {
        setConfig({ key: 'minecraft.screen.width', value: preset.width });
        setConfig({ key: 'minecraft.screen.height', value: preset.height });
      } catch (error) {
        toast.error('Failed to set screen resolution.');
      }
    }
  };

  const handleInputScreenWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const numeric = Number(val);
    setScreenWidth(numeric);
    setConfig({ key: 'minecraft.screen.width', value: numeric });
  };

  const handleInputScreenHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const numeric = Number(val);
    setScreenHeight(numeric);
    setConfig({ key: 'minecraft.screen.height', value: numeric });
  };

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
        queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <Tooltip content="Set the directory where Minecraft game files are stored">
        <label className="label">Game Location:</label>
      </Tooltip>
      <input
        type="text"
        className="input cursor-pointer col-span-2"
        value={appConfig?.minecraft.gameDir ?? ''}
        readOnly
        onClick={handleChooseGameDir}
      />

      <Tooltip content="Force GPU acceleration for better performance">
        <label className="label self-start">Force GPU:</label>
      </Tooltip>
      <select
        className="select col-span-2 cursor-pointer"
        value={String(appConfig?.minecraft.forceGPU ?? false)}
        onChange={(e) => setConfig({ key: 'minecraft.forceGPU', value: e.target.value === 'true' })}
      >
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>

      <Tooltip content="Choose display resolution or set custom dimensions">
        <label className="label self-start">Screen:</label>
      </Tooltip>
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <Tooltip content="Select from preset resolutions or enter custom values">
          <label className="label">Resolution:</label>
        </Tooltip>
        <select
          className="select cursor-pointer col-span-2"
          value={selectedScreenPreset}
          onChange={handleSelectScreenPreset}
        >
          {SCREEN_PRESETS.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>

        {selectedScreenPreset === 'custom' && (
          <>
            <Tooltip content="Screen width in pixels">
              <label className="label">Width:</label>
            </Tooltip>
            <input type="number" className="input col-span-2" value={screenWidth} onChange={handleInputScreenWidth} />

            <Tooltip content="Screen height in pixels">
              <label className="label">Height:</label>
            </Tooltip>
            <input type="number" className="input col-span-2" value={screenHeight} onChange={handleInputScreenHeight} />
          </>
        )}

        <Tooltip content="Stretch the game to cover the entire screen">
          <label className="label">Fullscreen:</label>
        </Tooltip>
        <select
          className="select cursor-pointer col-span-2"
          value={String(appConfig?.minecraft.screen.fullscreen ?? false)}
          onChange={(e) => setConfig({ key: 'minecraft.screen.fullscreen', value: e.target.value === 'true' })}
        >
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      </div>

      <Tooltip content="Configure Java runtime for Minecraft">
        <label className="label self-start">JAVA:</label>
      </Tooltip>
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <Tooltip content="Choose Java version to use">
          <label className="label">Type:</label>
        </Tooltip>
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

        <Tooltip content="Java version installed on your system">
          <label className="label">Version:</label>
        </Tooltip>
        <input type="number" className="input col-span-2" placeholder="Default" readOnly />

        <Tooltip content="Location of Java executable">
          <label className="label">Path:</label>
        </Tooltip>
        <input type="text" className="input col-span-2" placeholder="Default" readOnly />
      </div>

      <Tooltip content="Amount of RAM allocated for Minecraft">
        <label className="label">RAM:</label>
      </Tooltip>
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
