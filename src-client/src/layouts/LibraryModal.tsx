import { InstanceDto } from '@shared/dtos/instance.dto';
import { formatToSlug } from '@shared/utils/general.utils';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { RefObject, useEffect, useState } from 'react';

import instanceLogo from '~/assets/images/instance-logo.webp';
import fabricLogo from '~/assets/images/logos/fabric.png';
import forgeLogo from '~/assets/images/logos/forge.jpg';
import neoForgeLogo from '~/assets/images/logos/neoforge.png';
import quiltLogo from '~/assets/images/logos/quilt.png';
import Img from '~/components/Img';
import Modal from '~/components/Modal';
import Select from '~/components/Select';
import {
  useInstanceCreateMutation,
  useInstanceOneQuery,
  useInstancesQuery,
  useInstanceUpdateMutation,
} from '~/hooks/api/useInstanceApi';
import { useVersionLoadersQuery, useVersionReleasesQuery } from '~/hooks/api/useVersionApi';
import { toast } from '~/hooks/app/useToast';

interface LibraryModalProps {
  ref: RefObject<HTMLDialogElement>;
  id?: string;
}

export default function LibraryModal({ ref, id }: LibraryModalProps) {
  const [modpackName, setModpackName] = useState('');
  const [loaderType, setLoaderType] = useState<CurseForgeModLoaderType>(CurseForgeModLoaderType.Forge);
  const [loaderVersion, setLoaderVersion] = useState('latest');
  const [gameVersion, setGameVersion] = useState('');

  const { data: releaseVersions } = useVersionReleasesQuery();
  const { data: loaderVersions } = useVersionLoadersQuery({ type: loaderType, version: gameVersion });
  const { data: instance } = useInstanceOneQuery(id!);
  const { mutateAsync: createInstance } = useInstanceCreateMutation();
  const { mutateAsync: updateInstance } = useInstanceUpdateMutation();
  const { refetch: refetchInstances } = useInstancesQuery();

  useEffect(() => {
    if (releaseVersions && releaseVersions.length > 0) {
      setGameVersion(releaseVersions[0].version);
    }
  }, [releaseVersions]);

  useEffect(() => {
    if (id && instance) {
    }
  }, [id, instance]);

  const handleUpsertInstance = async () => {
    try {
      if (!modpackName) return toast.error('Modpack name is required');

      const dateNow = new Date().toISOString();

      const data: InstanceDto = {
        id: formatToSlug(modpackName),
        name: modpackName,
        createdAt: dateNow,
        updatedAt: dateNow,
        version: gameVersion,
        loader: {
          type: loaderType,
          version: loaderVersion,
        },
      };

      if (id) await updateInstance(data);
      else await createInstance(data);

      ref.current.close();
      setModpackName('');
      setLoaderType(CurseForgeModLoaderType.Forge);
      setLoaderVersion('latest');
      setGameVersion(releaseVersions?.[0].version ?? '');
      toast.success(`Modpack ${id ? 'updated' : 'created'} successfully`);
      refetchInstances();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <Modal
      ref={ref}
      title={`${id ? `Update` : 'Create new'} modpack`}
      iconClose={true}
      titlePosition="center"
      btnShow={false}
      backdropClose={true}
    >
      <div className="space-y-6 my-6">
        <div className="flex gap-4">
          <div className="flex-1/3 h-28">
            <Img src={instanceLogo} alt="Modpack logo" className="w-full h-full object-cover" />
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
                checked={loaderType === CurseForgeModLoaderType.Forge}
                onChange={() => {
                  setLoaderType(CurseForgeModLoaderType.Forge);
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
                checked={loaderType === CurseForgeModLoaderType.Fabric}
                onChange={() => {
                  setLoaderType(CurseForgeModLoaderType.Fabric);
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
                checked={loaderType === CurseForgeModLoaderType.Quilt}
                onChange={() => {
                  setLoaderType(CurseForgeModLoaderType.Quilt);
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
                checked={loaderType === CurseForgeModLoaderType.NeoForge}
                onChange={() => {
                  setLoaderType(CurseForgeModLoaderType.NeoForge);
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
              value={gameVersion}
              optionHeight={200}
              options={releaseVersions?.map(({ version }) => ({ label: version, value: version })) ?? []}
              onChange={setGameVersion}
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
                ...(loaderVersions?.map((v) => ({
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
          <button className="btn btn-primary w-1/4" onClick={handleUpsertInstance}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
