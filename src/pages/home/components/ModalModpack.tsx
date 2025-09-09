import { Instance } from '@shared/schemas/instance.schema';
import { formatToSlug } from '@shared/utils/general.utils';
import { useEffect, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import fabricLogo from '~/assets/imgs/logos/fabric.png';
import forgeLogo from '~/assets/imgs/logos/forge.jpg';
import neoForgeLogo from '~/assets/imgs/logos/neoforge.png';
import quiltLogo from '~/assets/imgs/logos/quilt.png';
import modpackLogo from '~/assets/imgs/modpack-logo.webp';
import Modal from '~/components/Modal';
import Select from '~/components/Select';
import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

interface ModalModpackProps {
  ref: React.RefObject<HTMLDialogElement>;
  instanceId: string | null;
}

export default function ModalModpack({ ref, instanceId }: ModalModpackProps) {
  const [modpackName, setModpackName] = useState('');
  const [loaderType, setLoaderType] = useState<'forge' | 'fabric' | 'quilt' | 'neoforge'>('forge');
  const [loaderVersion, setLoaderVersion] = useState('latest');
  const [version, setVersion] = useState('');

  // Launcher context
  const releaseVersionsQuery = useContextSelector(LauncherContext, (v) => v.releaseVersionsQuery);
  const loaderVersionsQuery = useContextSelector(LauncherContext, (v) => v.loaderVersionsQuery(version, loaderType));
  const createInstanceMutation = useContextSelector(LauncherContext, (v) => v.createInstanceMutation);
  const updateInstanceMutation = useContextSelector(LauncherContext, (v) => v.updateInstanceMutation);
  const getInstanceQuery = useContextSelector(LauncherContext, (v) => v.getInstanceQuery(instanceId ?? ''));
  const getAllInstanceQuery = useContextSelector(LauncherContext, (v) => v.getAllInstanceQuery);

  useEffect(() => {
    if (releaseVersionsQuery.isLoading) return;
    if (releaseVersionsQuery.data?.length) {
      setVersion(releaseVersionsQuery.data[0].version);
    }
  }, [releaseVersionsQuery.data, releaseVersionsQuery.isLoading]);

  useEffect(() => {
    if (getInstanceQuery.isLoading) return;
    if (getInstanceQuery.data) {
      const instance = getInstanceQuery.data;
      setModpackName(instance.name);
      setVersion(instance.version);
      setLoaderType(instance.loader.type as any);
      setLoaderVersion(instance.loader.version);
    }
  }, [getInstanceQuery.data, getInstanceQuery.isLoading]);

  const updateOrCreateInstance = async () => {
    if (!modpackName) return toast.error('Modpack name is required');

    const data: Instance = {
      id: instanceId ?? formatToSlug(modpackName),
      name: modpackName,
      version: version,
      loader: {
        type: loaderType,
        version: loaderVersion,
      },
      last_updated: new Date().toISOString(),
    };

    if (!instanceId) await createInstanceMutation.mutateAsync(data);
    else await updateInstanceMutation.mutateAsync(data);

    ref.current.close();
    setModpackName('');
    setLoaderType('forge');
    setLoaderVersion('latest');
    setVersion(releaseVersionsQuery.data?.[0].version ?? '');
    toast.success(`Modpack ${instanceId ? 'updated' : 'created'} successfully`);
    getAllInstanceQuery.refetch();
  };

  return (
    <Modal
      ref={ref}
      title="Create Modpack"
      iconClose={true}
      titlePosition="center"
      btnShow={false}
      backdropClose={true}
    >
      <div className="space-y-6 my-6">
        <div className="flex gap-4">
          <div className="flex-1/3 h-28">
            <img src={modpackLogo} alt="Modpack logo" className="w-full h-full object-cover" />
          </div>

          <div className="flex justify-center flex-col gap-2 flex-2/3">
            <label className="font-semibold">Modpack Name:</label>
            <input
              type="text"
              className="input w-full"
              value={modpackName}
              onChange={(e) => setModpackName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Game type:</label>

          <div className="flex flex-nowrap gap-2 justify-between">
            <label className="label">
              <input
                className="radio radio-primary"
                type="radio"
                name="loaderType"
                checked={loaderType === 'forge'}
                onChange={() => {
                  setLoaderType('forge');
                  setLoaderVersion('latest');
                }}
              />
              <img src={forgeLogo} alt="Forge" className="w-6 h-6" />
              <span>Forge</span>
            </label>

            <label className="label">
              <input
                className="radio radio-primary"
                type="radio"
                name="loaderType"
                checked={loaderType === 'fabric'}
                onChange={() => {
                  setLoaderType('fabric');
                  setLoaderVersion('latest');
                }}
              />
              <img src={fabricLogo} alt="Fabric" className="w-6 h-6" />
              <span>Fabric</span>
            </label>

            <label className="label">
              <input
                className="radio radio-primary"
                type="radio"
                name="loaderType"
                checked={loaderType === 'quilt'}
                onChange={() => {
                  setLoaderType('quilt');
                  setLoaderVersion('latest');
                }}
              />
              <img src={quiltLogo} alt="Quilt" className="w-6 h-6" />
              <span>Quilt</span>
            </label>

            <label className="label">
              <input
                className="radio radio-primary"
                type="radio"
                name="loaderType"
                checked={loaderType === 'neoforge'}
                onChange={() => {
                  setLoaderType('neoforge');
                  setLoaderVersion('latest');
                }}
              />
              <img src={neoForgeLogo} alt="NeoForge" className="w-6 h-6" />
              <span>NeoForge</span>
            </label>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col gap-2 flex-1/2">
            <label className="font-semibold">Minecraft version:</label>
            <Select
              className="w-full"
              value={version}
              optionHeight={200}
              options={releaseVersionsQuery.data?.map((v) => ({ label: v.version, value: v.version })) ?? []}
              onChange={setVersion}
            />
          </div>

          <div className="flex flex-col gap-2 flex-1/2">
            <label className="font-semibold">ModLoader version:</label>
            <Select
              className="w-full"
              value={loaderVersion}
              optionHeight={200}
              options={[
                { label: 'Latest', value: 'latest' },
                { label: 'Recommended', value: 'recommended' },
                ...(loaderVersionsQuery.data?.map((v) => ({
                  label: v.name,
                  value: v.loader!.version,
                })) ?? []),
              ]}
              onChange={setLoaderVersion}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="btn btn-soft w-1/4" onClick={() => ref.current.close()}>
            Cancel
          </button>
          <button className="btn btn-primary w-1/4" onClick={updateOrCreateInstance}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
