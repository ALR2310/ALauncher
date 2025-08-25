import { InstanceMeta } from '@shared/launcher.type';
import { formatToSlug, uniqueId } from '@shared/utils';
import React, { useEffect, useRef, useState } from 'react';

import fabricLogo from '~/assets/imgs/logos/fabric.png';
import forgeLogo from '~/assets/imgs/logos/forge.jpg';
import neoForgeLogo from '~/assets/imgs/logos/neoforge.png';
import quiltLogo from '~/assets/imgs/logos/quilt.png';
// import modpackLogo from '~/assets/imgs/modpack-logo.webp';
import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherInstances } from '~/hooks/launcher/useLauncherInstances';
import { LDVersion, useLauncherVersion } from '~/hooks/launcher/useLauncherVersions';
import { confirm } from '~/hooks/useConfirm';
import { toast } from '~/hooks/useToast';

import Modal from '../Modal';
import Select from '../Select';

const modpackLogo = 'https://i.imgur.com/4b1k0aH.png';

type LoaderType = 'forge' | 'fabric' | 'quilt' | 'neoforge';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [curSlug, setCurSlug] = useState('');

  const [loaderType, setLoaderType] = useState<LoaderType>('forge');
  const [loaderVersion, setLoaderVersion] = useState<string>('latest');
  const [modpackName, setModpackName] = useState('');
  const [version, setVersion] = useState('');
  const [searchKey, setSearchKey] = useState('');

  // Launcher state
  const { getConfig } = useLauncherConfig();
  const { getInstances, createInstance, updateInstance, deleteInstance } = useLauncherInstances();
  const { getVersions, getLoaders } = useLauncherVersion();
  const [ldVersion, setLdVersion] = useState<LDVersion[]>([]);

  const mcVersions = getVersions.data?.filter((v) => v.type !== 'modified');
  const username = getConfig.data?.username;
  const instances = getInstances.data;

  // Get loader when change mc version
  useEffect(() => {
    if (mcVersions?.length && !version) {
      setVersion(mcVersions[0].version);
      getLoaders.mutateAsync(mcVersions[0].version).then((data) => {
        setLdVersion(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcVersions, version]);

  // Update loader when change mc version
  useEffect(() => {
    if (!version) return;
    getLoaders.mutateAsync(version).then((data) => {
      setLdVersion(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleCreateOrUpdateInstance = async () => {
    if (!modpackName.trim()) return toast.warning('Vui lòng nhập tên modpack');

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
      url: '',
      author: username ?? '',
      last_updated: new Date().toISOString(),
    };

    if (!curSlug) {
      const result = await createInstance.mutateAsync(data);
      if (!result.success) return toast.error(result.message ?? 'Có lỗi xảy ra, vui lòng thử lại sau!');
    } else {
      const result = await updateInstance.mutateAsync({ slug: curSlug, instance: data });
      if (!result.success) return toast.error(result.message ?? 'Có lỗi xảy ra, vui lòng thử lại sau!');
    }

    getInstances.refetch();
    modalRef.current?.close();
    toast.success(`${!curSlug ? 'tạo' : 'cập nhật'} Modpack thành công!`);
    setCurSlug('');
    setModpackName('');
    setLoaderType('forge');
    setLoaderVersion('latest');
    setVersion(mcVersions?.[0].version ?? '');
  };

  const handleDeleteInstance = async (slug: string) => {
    const isOK = await confirm({
      title: 'Xoá Modpack',
      content: 'Bạn có chắc muốn xoá modpack này? Hành động này không thể hoàn tác!',
      classNameContent: 'absolute top-1/5',
    });

    if (isOK) {
      const result = await deleteInstance.mutateAsync(slug);
      if (!result.success) return toast.error(result.message ?? 'Có lỗi xảy ra, vui lòng thử lại sau!');
      getInstances.refetch();
      toast.success('Xoá Modpack thành công!');
    }
  };

  return (
    <React.Fragment>
      <div id="sidebar" className={`p-3 space-y-3 flex flex-col ${className}`}>
        <button
          className="btn btn-soft btn-primary w-full"
          onClick={() => {
            setCurSlug('');
            modalRef.current?.showModal();
          }}
        >
          <i className="fa-light fa-plus"></i>
          Tạo modpack
        </button>

        <label className="input">
          <i className="fa-light fa-magnifying-glass text-base-content/60"></i>
          <input
            type="search"
            className="grow"
            placeholder="Tìm kiếm..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
          />
        </label>

        <div className="flex-1 space-y-3 overflow-auto no-scrollbar">
          {instances?.length ? (
            instances
              .filter((i) => i.name.toLowerCase().includes(searchKey.toLowerCase()))
              .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
              .map((instance) => (
                <div
                  key={instance.slug}
                  className="relative w-full h-[32%] group overflow-hidden"
                  style={{
                    backgroundImage: `url(${modpackLogo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  tabIndex={0}
                >
                  {/* Version */}
                  <div className="absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box text-sm">
                    <i className="fa-light fa-gamepad-modern"></i>
                    {` ${instance.loader.name}-${instance.minecraft}`}
                  </div>

                  {/* Button action */}
                  <div className="absolute top-0 left-0">
                    <button
                      className="btn btn-sm btn-ghost btn-circle"
                      onClick={() => handleDeleteInstance(instance.slug)}
                    >
                      <i className="fa-light fa-trash-can"></i>
                    </button>
                  </div>

                  {/* Info */}
                  <div
                    className="absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 
                    space-y-3 transform transition-transform duration-300 translate-y-[calc(100%-40px)] 
                    group-hover:translate-y-0 group-focus:translate-y-0"
                  >
                    <p className="font-semibold">{instance.name}</p>
                    <div className="join flex">
                      <button
                        className="btn btn-primary join-item"
                        onClick={() => {
                          setCurSlug(instance.slug);
                          setModpackName(instance.name);
                          setLoaderType(instance.loader.name as LoaderType);
                          setLoaderVersion(instance.loader.version);
                          setVersion(instance.minecraft);
                          modalRef.current?.showModal();
                        }}
                      >
                        <i className="fa-light fa-pen-to-square"></i>
                      </button>
                      <button className="btn btn-primary join-item flex-1">Tải về</button>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-base-content/60">Không có modpack nào</p>
          )}
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
                options={mcVersions?.map((v) => ({ label: v.name, value: v.version })) ?? []}
                onChange={setVersion}
              />
            </div>

            <div className="flex flex-col gap-2 flex-1/2">
              <label className="font-semibold">Phiên bản modloader:</label>
              <Select
                className="w-full"
                value={loaderVersion}
                optionHeight={200}
                options={[
                  { label: 'Latest', value: 'latest' },
                  { label: 'Recommended', value: 'recommended' },
                  ...ldVersion
                    .filter((v) => v.type === loaderType)
                    .map((v) => ({
                      label: `${v.type}-${v.name}`,
                      value: v.name,
                    })),
                ]}
                onChange={setLoaderVersion}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="btn btn-soft w-1/4" onClick={() => modalRef.current?.close()}>
              Huỷ
            </button>
            <button className="btn btn-primary w-1/4" onClick={handleCreateOrUpdateInstance}>
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
}
