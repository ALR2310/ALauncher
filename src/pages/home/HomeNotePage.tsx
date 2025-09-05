import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

function prepareBody(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('h1').forEach((el) => el.classList.add('text-xl', 'font-semibold'));
  doc.querySelectorAll('ul').forEach((ul) => ul.classList.add('list-disc', 'pl-5'));
  doc.querySelectorAll('li > a').forEach((a) => a.classList.add('link', 'link-primary'));

  return doc.body.innerHTML;
}

export default function HomeNotePage({ className }: { className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const { height, isReady } = useContentHeight();
  const releaseNoteQuery = useContextSelector(LauncherContext, (v) => v.releaseNoteQuery);

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = releaseNoteQuery;

  useEffect(() => {
    const el = divRef.current;
    if (!el || !hasNextPage) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 200 && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={divRef}
      className={`${className} h-full bg-base-300/50 p-3 space-y-4 overflow-y-scroll`}
      style={{ height }}
    >
      {isReady &&
        data?.pages.flatMap((page) =>
          page.map((note) => (
            <div key={note.version} className="space-y-2">
              <h1 className="font-bold text-2xl">{note.title}</h1>
              <p className="text-base-content/50 font-semibold">
                <i className="fa-light fa-calendar"></i> {dayjs(note.date).format('DD/MM/YYYY')}
              </p>
              <div className="space-y-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: prepareBody(note.body) }} />
            </div>
          )),
        )}
      {isFetchingNextPage && (
        <div className="text-center">
          <div>
            Loading <span className="loading loading-dots loading-md"></span>
          </div>
        </div>
      )}
    </div>
  );
}
