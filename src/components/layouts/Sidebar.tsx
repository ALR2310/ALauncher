import { InstanceMeta } from '@shared/launcher.type';
import { formatToSlug, uniqueId } from '@shared/utils';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import fabricLogo from '~/assets/imgs/logos/fabric.png';
import forgeLogo from '~/assets/imgs/logos/forge.jpg';
import neoForgeLogo from '~/assets/imgs/logos/neoforge.png';
import quiltLogo from '~/assets/imgs/logos/quilt.png';
import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

// import modpackLogo from '~/assets/imgs/modpack-logo.webp';
import Modal from '../Modal';
import Select from '../Select';

const modpackLogo = 'https://i.imgur.com/4b1k0aH.png';

type LoaderType = 'forge' | 'fabric' | 'quilt' | 'neoforge';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [loaderType, setLoaderType] = useState<LoaderType>('forge');
  const [loaderVersion, setLoaderVersion] = useState<string>('latest');
  const [modpackName, setModpackName] = useState('');

  // Launcher Context selectors
  const version = useContextSelector(LauncherContext, (ctx) => ctx.version);
  const versionList = useContextSelector(LauncherContext, (ctx) => ctx.versionList);
  const setVersionLoader = useContextSelector(LauncherContext, (ctx) => ctx.setVersionLoader);
  const loaderList = useContextSelector(LauncherContext, (ctx) => ctx.loaderList);
  const instances = useContextSelector(LauncherContext, (ctx) => ctx.instances);
  const username = useContextSelector(LauncherContext, (ctx) => ctx.configs?.username);
  const createInstance = useContextSelector(LauncherContext, (ctx) => ctx.createInstance);
  const createInstanceResult = useContextSelector(LauncherContext, (ctx) => ctx.createInstanceResult);
  const updateInstance = useContextSelector(LauncherContext, (ctx) => ctx.updateInstance);
  const updateInstanceResult = useContextSelector(LauncherContext, (ctx) => ctx.updateInstanceResult);
  const deleteInstance = useContextSelector(LauncherContext, (ctx) => ctx.deleteInstance);
  const deleteInstanceResult = useContextSelector(LauncherContext, (ctx) => ctx.deleteInstanceResult);

  // Unique loader list based on selected loader type
  const [uniqueLoaderList, setUniqueLoaderList] = useState<any[]>([]);

  useEffect(() => {
    if (!loaderList || !loaderList.length) return;

    const uniqueList = loaderList
      .filter(
        (loader) =>
          loader.type === (loaderType === 'forge' ? 1 : loaderType === 'fabric' ? 4 : loaderType === 'quilt' ? 5 : 6),
      )
      .filter((loader, idx, self) => idx === self.findIndex((l) => l.name === loader.name))
      .map((loader) => ({
        label: loader.name,
        value: loader.name,
      }));

    const extraOptions = [
      { label: 'latest', value: 'latest' },
      { label: 'recommended', value: 'recommended' },
    ];

    setUniqueLoaderList([...extraOptions, ...uniqueList]);
  }, [loaderList, loaderType]);

  const handleUpsertModpack = () => {
    if (!modpackName) return toast.warning('Vui lòng nhập tên modpack');
    if (!loaderVersion) return toast.warning('Vui lòng chọn phiên bản modloader');

    const data: InstanceMeta = {
      id: uniqueId(),
      name: modpackName,
      slug: formatToSlug(modpackName),
      description: '',
      version: '1.0.0',
      minecraft: version,
      loader: {
        name: loaderType,
        version: loaderVersion,
      },
      icon: modpackLogo,
      author: username!,
      last_updated: dayjs().toISOString(),
    };

    if (isEditing) updateInstance(data);
    else createInstance(data);
  };

  useEffect(() => {
    if (!createInstanceResult) return;
    if (createInstanceResult.success) {
      toast.success(createInstanceResult?.message);

      setModpackName('');
      setLoaderType('forge');
      setLoaderVersion('latest');
      modalRef.current?.close();
    } else toast.error(createInstanceResult?.message);
  }, [createInstanceResult]);

  useEffect(() => {
    if (!updateInstanceResult) return;
    if (updateInstanceResult.success) toast.success(updateInstanceResult?.message);
    else toast.error(updateInstanceResult?.message);

    setModpackName('');
    setLoaderType('forge');
    setLoaderVersion('latest');
    modalRef.current?.close();
  }, [updateInstanceResult]);

  useEffect(() => {
    if (!deleteInstanceResult) return;
    if (deleteInstanceResult.success) toast.success(deleteInstanceResult?.message);
    else toast.error(deleteInstanceResult?.message);
  }, [deleteInstanceResult]);

  return (
    <React.Fragment>
      <div className={`p-3 space-y-3 flex flex-col ${className}`}>
        <button
          className="btn btn-soft btn-primary w-full"
          onClick={() => {
            setIsEditing(false);
            modalRef.current?.showModal();
          }}
        >
          <i className="fa-light fa-plus"></i>
          Tạo modpack
        </button>

        <label className="input">
          <i className="fa-light fa-magnifying-glass text-base-content/60"></i>
          <input type="search" className="grow" placeholder="Tìm kiếm..." />
        </label>

        <div className="flex-1 space-y-3 overflow-auto">
          {[...instances]
            .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
            .map((instance) => (
              <div
                key={instance.id}
                className="relative w-full h-[35%] group overflow-hidden"
                style={{
                  backgroundImage: `url(${instance.icon})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                tabIndex={0}
              >
                {/* Version */}
                <div className="absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
                  <i className="fa-light fa-gamepad-modern"></i>
                  {instance.minecraft}
                </div>

                {/* Button action */}
                <div className="absolute top-0 left-0">
                  <button
                    className="btn btn-sm btn-soft btn-primary btn-circle"
                    onClick={() => {
                      deleteInstance(instance.slug);
                    }}
                  >
                    <i className="fa-light fa-trash-can"></i>
                  </button>
                </div>

                {/* Info */}
                <div className="absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 space-y-4 transform transition-transform duration-300 translate-y-[calc(100%-48px)] group-hover:translate-y-0 group-focus:translate-y-0">
                  <p className="font-semibold">{instance.name}</p>
                  <div className="join flex">
                    <button
                      className="btn btn-primary join-item"
                      onClick={() => {
                        setIsEditing(true);
                        setModpackName(instance.name);
                        setLoaderType(instance.loader.name as LoaderType);
                        setLoaderVersion(instance.loader.version);
                        modalRef.current?.showModal();
                      }}
                    >
                      <i className="fa-light fa-pen-to-square"></i>
                    </button>
                    <button className="btn btn-primary join-item flex-1">Tải về</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Modal title="Tạo Modpack" ref={modalRef} titlePosition="center" btnShow={false} backdropClose={true}>
        <div className="space-y-6 my-6">
          <div className="flex gap-4">
            <div className="flex-1/3 h-28">
              <img src={modpackLogo} alt="Modpack logo" className="w-full h-full object-cover" />
            </div>

            <div className="flex justify-center flex-col gap-2 flex-2/3">
              <label className="font-semibold">Tên Modpack:</label>
              <input
                type="text"
                className="input w-full"
                value={modpackName}
                onChange={(e) => setModpackName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold">Loại game:</label>

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
              <label className="font-semibold">Phiên bản minecraft:</label>
              <Select
                className="w-full"
                value={version}
                optionHeight={200}
                options={versionList ?? []}
                onChange={(e) => {
                  setUniqueLoaderList([]);
                  setVersionLoader(e);
                }}
              />
            </div>

            <div className="flex flex-col gap-2 flex-1/2">
              <label className="font-semibold">Phiên bản modloader:</label>
              <Select
                className="w-full"
                value={loaderVersion}
                optionHeight={200}
                options={uniqueLoaderList}
                onChange={setLoaderVersion}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="btn btn-soft w-1/4" onClick={() => modalRef.current?.close()}>
              Huỷ
            </button>
            <button className="btn btn-primary w-1/4" onClick={() => handleUpsertModpack()}>
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
}
