import React, { useEffect, useRef, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import fabricLogo from '~/assets/imgs/logos/fabric.png';
import forgeLogo from '~/assets/imgs/logos/forge.jpg';
import neoForgeLogo from '~/assets/imgs/logos/neoforge.png';
import quiltLogo from '~/assets/imgs/logos/quilt.png';
import { LauncherContext } from '~/providers/LauncherProvider';

// import modpackLogo from '~/assets/imgs/modpack-logo.webp';
import Modal from '../Modal';
import Select from '../Select';

const modpackLogo = 'https://i.imgur.com/4b1k0aH.png';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [loaderType, setLoaderType] = useState<number>(1); // Forge: 1, Fabric: 4, Quilt: 5, NeoForge: 6
  const [currLoader, setCurrLoader] = useState<string>('');

  // Launcher Context selectors
  const version = useContextSelector(LauncherContext, (ctx) => ctx.version);
  const versionList = useContextSelector(LauncherContext, (ctx) => ctx.versionList);
  const setVersionLoader = useContextSelector(LauncherContext, (ctx) => ctx.setVersionLoader);
  const loaderList = useContextSelector(LauncherContext, (ctx) => ctx.loaderList);

  const [uniqueLoaderList, setUniqueLoaderList] = useState<any[]>([]);

  useEffect(() => {
    if (!loaderList || !loaderList.length) return;
    setUniqueLoaderList(
      loaderList
        .filter((loader) => loader.type === loaderType)
        .filter((loader, idx, self) => idx === self.findIndex((l) => l.name === loader.name))
        .map((loader) => ({
          label: loader.name,
          value: loader.name,
          recommended: loader.recommended,
        })),
    );
  }, [loaderList, loaderType]);

  return (
    <React.Fragment>
      <div className={`p-3 space-y-3 overflow-auto ${className}`}>
        <button className="btn btn-soft btn-primary w-full" onClick={() => modalRef.current?.showModal()}>
          <i className="fa-light fa-plus"></i>
          Tạo modpack
        </button>

        <label className="input">
          <i className="fa-light fa-magnifying-glass text-base-content/60"></i>
          <input type="search" className="grow" placeholder="Tìm kiếm..." />
        </label>

        <div
          className="relative w-full h-[35%] group overflow-hidden"
          style={{
            backgroundImage: `url(${modpackLogo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          tabIndex={0}
        >
          {/* Version */}
          <div className="absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
            <i className="fa-light fa-gamepad-modern"></i>
            1.21.1
          </div>

          {/* Info */}
          <div
            className="absolute left-0 right-0 bottom-0 p-4 bg-base-300/60 space-y-4 transform transition-transform duration-300
               translate-y-[calc(100%-48px)] group-hover:translate-y-0 group-focus:translate-y-0"
          >
            <p className="font-semibold">Tên modpack</p>
            <button className="btn btn-primary w-full">Tải về</button>
          </div>
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
              <input type="text" className="input w-full" />
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
                  value="Forge"
                  checked={loaderType === 1}
                  onChange={() => setLoaderType(1)}
                />
                <img src={forgeLogo} alt="Forge" className="w-6 h-6" />
                <span>Forge</span>
              </label>

              <label className="label">
                <input
                  className="radio radio-primary"
                  type="radio"
                  name="loaderType"
                  value="Fabric"
                  checked={loaderType === 4}
                  onChange={() => setLoaderType(4)}
                />
                <img src={fabricLogo} alt="Fabric" className="w-6 h-6" />
                <span>Fabric</span>
              </label>

              <label className="label">
                <input
                  className="radio radio-primary"
                  type="radio"
                  name="loaderType"
                  value="Quilt"
                  checked={loaderType === 5}
                  onChange={() => setLoaderType(5)}
                />
                <img src={quiltLogo} alt="Quilt" className="w-6 h-6" />
                <span>Quilt</span>
              </label>

              <label className="label">
                <input
                  className="radio radio-primary"
                  type="radio"
                  name="loaderType"
                  value="NeoForge"
                  checked={loaderType === 6}
                  onChange={() => setLoaderType(6)}
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
                value={currLoader}
                optionHeight={200}
                options={uniqueLoaderList}
                onChange={(e) => setCurrLoader(e)}
                render={(item) => (
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span>{item.label}</span>
                    {item.recommended && (
                      <div className="rating rating-xs">
                        <div className="mask mask-star-2 bg-yellow-500!"></div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              className="btn btn-soft w-1/4"
              onClick={() => {
                modalRef.current?.close();
              }}
            >
              Huỷ
            </button>
            <button
              className="btn btn-primary w-1/4"
              onClick={() => {
                modalRef.current?.close();
              }}
            >
              Tạo
            </button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
}
