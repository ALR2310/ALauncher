import { getCurrentWindow } from '@tauri-apps/api/window';
import dayjs from 'dayjs';
import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

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
  const isReady = useRef<boolean>(false);
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

  const updateHeight = throttle(() => {
    if (!divRef.current) return;
    const layoutEl = document.getElementById('layout')!;
    const dockEl = document.getElementById('dockNav')!;
    const height = layoutEl.offsetHeight - dockEl.offsetHeight;
    divRef.current.style.height = `${height}px`;
    isReady.current = true;
  }, 200);

  useEffect(() => {
    updateHeight();

    if (window.isTauri) {
      const unlistenPromise = getCurrentWindow().onResized(() => {
        updateHeight();
      });

      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }
  }, [updateHeight]);

  return (
    <div ref={divRef} className={`${className} h-full bg-base-300/50 p-3 space-y-4 overflow-y-scroll`}>
      {isReady.current &&
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
