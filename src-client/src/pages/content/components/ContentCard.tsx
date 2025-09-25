import { ContentResponseDto } from '@shared/dtos/content.dto';
import { AddContentInstanceDto } from '@shared/dtos/instance.dto';
import { WorldDto } from '@shared/dtos/world.dto';
import { categoryMap, loaderMap } from '@shared/mappings/general.mapping';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { capitalize } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import worldIcon from '~/assets/imgs/world_default.png';
import Modal from '~/components/Modal';
import { useAddContentInstanceEvent } from '~/hooks/api/useInstance';

import { ContentContext } from '../context/ContentContext';

interface ContentCardProps {
  data: ContentResponseDto['data'][0];
  categoryType: string;
  versionSelected: string;
  loaderType: string;
  worlds: WorldDto[];
}

export function ContentCard({ data, categoryType, versionSelected, loaderType, worlds }: ContentCardProps) {
  const instanceId = useContextSelector(ContentContext, (c) => c.instanceId);
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [worldsSelected, setWorldsSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<'Install' | 'Installing' | 'Installed'>('Install');
  const { addContent, isDownloading, progress } = useAddContentInstanceEvent();

  useEffect(() => {
    if (data.status === 'latest') setStatus('Installed');
  }, [data.status]);

  useEffect(() => {
    if (progress !== undefined && progress >= 100) {
      setStatus('Installed');
    }
  }, [progress]);

  const handleInstall = () => {
    const query: AddContentInstanceDto = {
      id: instanceId!,
      type: categoryMap.keyToText[categoryType].toLowerCase().replace(/\s+/g, ''),
      contentId: data.id,
      ...(worldsSelected.length ? { worlds: worldsSelected.join(',') } : {}),
    };
    addContent(query);
    setStatus('Installing');
  };

  return (
    <React.Fragment>
      <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
        <div className={`flex justify-center items-center min-w-24 ${!imgLoaded ? 'skeleton' : ''}`}>
          <img
            src={data.logoUrl}
            alt="mod img"
            loading="lazy"
            className="w-full h-full object-cover"
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="flex">
            <div className="flex-1">
              <div className="flex items-center font-semibold ">
                <Link
                  to={`/contents/${data.id}`}
                  className="text-base-content text-ellipsis-1 hover:text-primary hover:underline hover:underline-offset-4 hover:cursor-pointer hover:decoration-2"
                >
                  {data.name}
                </Link>
                <div className="divider divider-horizontal"></div>
                <a
                  href={data.authors[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base-content/60 text-nowrap hover:text-primary hover:underline hover:underline-offset-4 hover:cursor-pointer hover:decoration-2"
                >
                  by {data.authors[0].name}
                </a>
              </div>

              <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">{data.summary}</p>
            </div>

            <div className="w-[15%]">
              <button
                className={`btn btn-soft w-full ${status !== 'Install' || !instanceId ? 'pointer-events-none' : 'btn-primary'} ${status === 'Installed' ? 'btn-success ' : 'btn-primary'}`}
                disabled={!instanceId}
                onClick={() => {
                  if (categoryType === categoryMap.idToKey['6945']) modalRef.current?.showModal();
                  else handleInstall();
                }}
              >
                {status}
              </button>
            </div>
          </div>

          <div className="divider m-0"></div>

          {isDownloading ? (
            <progress className="progress w-full mb-2 h-3 progress-no-rounded" value={progress} max="100"></progress>
          ) : (
            <div className="flex justify-between text-xs text-base-content/70">
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-xs">{categoryMap.keyToText[categoryType]}</button>
                <div className="flex gap-2 overflow-hidden text-ellipsis-1 w-[50%]">
                  {data.categories.map((cat, idx) => (
                    <a href="#" key={idx} className="block hover:underline">
                      {cat.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-nowrap">
                <p>
                  <i className="fa-light fa-download"></i> {abbreviateNumber(data.downloadCount)}
                </p>
                <p>
                  <i className="fa-light fa-clock-three"></i> {new Date(data.dateModified).toLocaleDateString()}
                </p>
                <p>
                  <i className="fa-light fa-database"></i> {data.fileSize}
                </p>
                <p>
                  <i className="fa-light fa-gamepad-modern"></i> {versionSelected}
                </p>
                <p>{loaderType === '0' ? '' : capitalize(loaderMap.idToKey[loaderType])}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal ref={modalRef} btnShow={false} backdropClose={true} iconClose={true} title="Select Worlds to Install">
        <div className="space-y-2 mt-4">
          {worlds.length ? (
            worlds.map((w, idx) => (
              <label key={idx} className="flex justify-between bg-base-200 rounded-box cursor-pointer p-2">
                <div className="flex gap-2 ">
                  <div className="w-16 h-16">
                    <img src={w.icon ?? worldIcon} alt={w.name} loading="lazy" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{w.name}</p>
                    <span className="label text-sm">{w.folderName}</span>
                  </div>
                </div>

                <div className="flex justify-center items-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-lg"
                    onChange={() => {
                      setWorldsSelected((prev) =>
                        prev.includes(w.folderName) ? prev.filter((p) => p !== w.folderName) : [...prev, w.folderName],
                      );
                    }}
                  />
                </div>
              </label>
            ))
          ) : (
            <p>No worlds found</p>
          )}
        </div>

        <form method="dialog" className="flex justify-end mt-4 gap-3">
          <button className="btn btn-soft w-[90px]">Cancel</button>
          <button className="btn btn-primary w-[90px]" disabled={!instanceId} onClick={handleInstall}>
            OK
          </button>
        </form>
      </Modal>
    </React.Fragment>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
      <div className="skeleton w-24"></div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex">
          <div className="flex-1 space-y-2">
            <div className="flex">
              <div className="h-4 skeleton w-2/4"></div>
              <div className="divider divider-horizontal"></div>
              <div className="h-4 skeleton w-1/4"></div>
            </div>
            <div className="h-4 skeleton w-4/5"></div>
          </div>

          <div className="w-[15%] skeleton btn"></div>
        </div>

        <div className="divider m-0"></div>

        <div className="flex justify-between">
          <div className="h-4 skeleton w-1/4"></div>
          <div className="h-4 skeleton w-2/4"></div>
        </div>
      </div>
    </div>
  );
}
