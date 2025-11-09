import { InstanceDto } from '@shared/dtos/instance.dto';
import { ReleaseNoteDto } from '@shared/dtos/version.dto';
import { InstanceStatusEnum } from '@shared/enums/general.enum';
import { useQueryClient } from '@tanstack/react-query';
import { CurseForgeModLoaderType } from 'curseforge-api';
import debounce from 'lodash/debounce';
import { Gamepad2, PencilLine } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';

import instanceLogo from '~/assets/images/instance-logo.webp';
import steveFace from '~/assets/images/steve-face.png';
import Img from '~/components/Img';
import { useAppGetConfigQuery, useAppSetConfigMutation } from '~/hooks/api/useAppApi';
import { useInstanceDownloadMutation, useInstancesQuery } from '~/hooks/api/useInstanceApi';
import { useVersionNotesInfinite } from '~/hooks/api/useVersionApi';

const ReleaseCard = ({ data }: { data: ReleaseNoteDto }) => {
  return (
    <Link to={''} className="relative block rounded-xl overflow-hidden border border-base-content/10">
      <Img src={data.image.url} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative p-3 text-base-content space-y-2">
        <p className="text-lg font-semibold">{data.title}</p>
        <p className="opacity-90 line-clamp-4">{data.shortText}</p>
      </div>
    </Link>
  );
};

const ModpackCard = ({ data }: { data: InstanceDto }) => {
  const queryClient = useQueryClient();
  const { mutateAsync: downloadModpack, isPending } = useInstanceDownloadMutation();

  return (
    <div
      className="h-40 relative group overflow-hidden bg-base-100 rounded-xl"
      style={{
        backgroundImage: `url(${import.meta.env.VITE_ENV ? 'https://i.imgur.com/4b1k0aH.png' : instanceLogo} )`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-center gap-2 absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
        <Gamepad2 size={20} />
        {`${data.loader ? CurseForgeModLoaderType[data.loader.type] : 'Release'} ${data.version}`}
      </div>

      <div
        className={`absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 space-y-3 translate-y-[calc(100%-40px)] transform transition-transform duration-300 group-hover:translate-y-0 group-focus:translate-y-0`}
      >
        <p className="font-semibold">{data.name}</p>
        <div className="h-10 w-full">
          <button
            className="btn btn-success btn-block"
            onClick={() => {
              downloadModpack(data.id)
                .catch((err) => {
                  toast.error(`Download failed: ${err.message}`);
                })
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ['instances'] });
                  toast.success('Download successfully');
                });
            }}
            disabled={isPending}
          >
            {isPending && <span className="loading loading-spinner"></span>} Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InfoPanel() {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useVersionNotesInfinite({ pageSize: 10 });
  const { data: instances } = useInstancesQuery({ type: 'cloud' });
  const { data: config } = useAppGetConfigQuery();
  const { mutate } = useAppSetConfigMutation();
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('release');
  const configInit = useRef(false);

  const debouncedMutate = useMemo(() => debounce(mutate, 1000), [mutate]);

  const notes = data?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    if (!configInit.current && config?.auth.username !== undefined) {
      setUsername(config.auth.username);
      configInit.current = true;
    }
  }, [config]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { root: document.querySelector('#release-scroll'), rootMargin: '0px 0px 200px 0px', threshold: 0.1 },
    );

    const current = loaderRef.current;
    observer.observe(current);
    return () => observer.unobserve(current);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col min-h-0 py-3 px-1 w-72 lg:w-80 space-y-4">
      <div className="flex gap-2 p-3 bg-base-100 rounded-xl border border-base-content/10">
        <Img
          src={steveFace}
          alt="Steve Face"
          loading="lazy"
          className="w-10 border border-base-content/30 rounded-lg"
        />

        <div className="flex flex-col">
          <label className="input border-t-0 border-l-0 border-r-0 outline-none! rounded-none">
            <input
              type="text"
              placeholder="Your name"
              className="grow outline-none!"
              value={username}
              onChange={(e) => {
                const value = e.target.value;
                setUsername(value);
                debouncedMutate({ key: 'auth.username', value });
              }}
            />
            <PencilLine className="opacity-60" />
          </label>
        </div>
      </div>

      <div className="divider">
        <div role="tablist" className="tabs tabs-border tabs-border-success gap-4 justify-center flex-nowrap">
          <input
            type="radio"
            name="info-panel-tab"
            className="tab px-0"
            aria-label="Release Note"
            checked={activeTab === 'release'}
            onChange={() => setActiveTab('release')}
          />
          <input
            type="radio"
            name="info-panel-tab"
            className="tab px-0"
            aria-label="My Modpack"
            checked={activeTab === 'modpack'}
            onChange={() => setActiveTab('modpack')}
          />
        </div>
      </div>

      <div id="release-scroll" className="flex-1 overflow-y-auto no-scrollbar space-y-4">
        {activeTab === 'modpack' && (
          <>
            {instances?.length ? (
              instances
                .filter((item) => item.status === InstanceStatusEnum.NotInstalled)
                .map((item, idx) => <ModpackCard key={idx} data={item} />)
            ) : (
              <p className="text-center opacity-70">No modpack found.</p>
            )}
          </>
        )}

        {activeTab === 'release' && (
          <>
            {notes.map((item, idx) => (
              <ReleaseCard key={idx} data={item} />
            ))}

            <div ref={loaderRef} className="py-3 text-center text-sm opacity-70">
              {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
