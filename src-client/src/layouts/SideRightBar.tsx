import { ReleaseNoteDto } from '@shared/dtos/version.dto';
import debounce from 'lodash/debounce';
import { PencilLine } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';

import steveFace from '~/assets/images/steve-face.png';
import Img from '~/components/Img';
import { useAppGetConfigQuery, useAppSetConfigMutation } from '~/hooks/api/useAppApi';
import { useVersionNotesInfinite } from '~/hooks/api/useVersionApi';

const ReleaseCard = ({ data }: { data: ReleaseNoteDto }) => {
  return (
    <Link to={''} className="relative block rounded-xl overflow-hidden border border-base-content/10">
      <img src={data.image.url} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative p-3 text-base-content space-y-2">
        <p className="text-lg font-semibold">{data.title}</p>
        <p className="opacity-90 line-clamp-4">{data.shortText}</p>
      </div>
    </Link>
  );
};

export default function SideRightBar() {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useVersionNotesInfinite({ pageSize: 10 });
  const { data: config } = useAppGetConfigQuery();
  const { mutate } = useAppSetConfigMutation();
  const [username, setUsername] = useState('');
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
    <div className="py-3 px-1 w-72 lg:w-80 space-y-4 overflow-y-auto " id="release-scroll">
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

      {notes.map((item, idx) => (
        <ReleaseCard key={idx} data={item} />
      ))}

      <div ref={loaderRef} className="py-3 text-center text-sm opacity-70">
        {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : ''}
      </div>
    </div>
  );
}
