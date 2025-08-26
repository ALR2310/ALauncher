import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

interface ReleaseNoteEntry {
  title: string;
  version: string;
  type: 'snapshot' | 'release' | 'beta';
  contentPath: string;
  date: string;
}

interface ReleaseNote {
  version: number;
  entries: ReleaseNoteEntry[];
}

interface ReleaseNoteDetails extends Omit<ReleaseNoteEntry, 'contentPath'> {
  body: string;
}

function prepareBody(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('h1').forEach((el) => el.classList.add('text-xl', 'font-semibold'));
  doc.querySelectorAll('ul').forEach((ul) => ul.classList.add('list-disc', 'pl-5'));
  doc.querySelectorAll('li > a').forEach((a) => a.classList.add('link', 'link-primary'));

  return doc.body.innerHTML;
}

const API = 'https://launchercontent.mojang.com/v2/';

async function fetchEntries(): Promise<ReleaseNoteEntry[]> {
  const res = await axios.get(`${API}javaPatchNotes.json`);
  const data = res.data as ReleaseNote;
  return data.entries.filter((e) => e.type === 'release');
}

async function fetchEntry(entry: ReleaseNoteEntry): Promise<ReleaseNoteDetails> {
  const res = await axios.get(`${API}${entry.contentPath}`);
  return res.data as ReleaseNoteDetails;
}

export default function ReleaseNotePage() {
  const divRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const listQuery = useQuery({
    queryKey: ['release-notes'],
    queryFn: fetchEntries,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['release-notes-details'],
    queryFn: async ({ pageParam = 0 }) => {
      const list = listQuery.data ?? [];
      const limit = 5;
      const slice = list.slice(pageParam, pageParam + limit);
      const details = await Promise.all(slice.map(fetchEntry));
      return { data: details, nextOffset: pageParam + limit, total: list.length };
    },
    getNextPageParam: (lastPage) => (lastPage.nextOffset < lastPage.total ? lastPage.nextOffset : undefined),
    enabled: !!listQuery.data,
    initialPageParam: 0,
  });

  useEffect(() => {
    if (!divRef.current) return;
    const layoutEl = document.getElementById('layout')!;
    const dockEl = document.getElementById('dockNavbar');
    const sideEl = document.getElementById('sidebar');

    let divHeight = 0;
    let divWidth = 0;
    if (dockEl) divHeight = layoutEl.offsetHeight - dockEl.offsetHeight;
    if (sideEl) divWidth = layoutEl.offsetWidth - sideEl.offsetWidth;

    divRef.current.style.height = `${divHeight}px`;
    divRef.current.style.width = `${divWidth}px`;

    setIsReady(true);
  }, []);

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
    <div ref={divRef} className="h-full w-full p-4 space-y-4 overflow-auto">
      {listQuery.isLoading && <div>Đang tải danh sách...</div>}
      {isReady &&
        data?.pages.flatMap((page) =>
          page.data.map((note) => (
            <div key={note.version} className="overflow-hidden space-y-2 text-wrap">
              <h1 className="font-bold text-2xl">{note.title}</h1>
              <p className="text-base-content/50 font-semibold">
                <i className="fa-light fa-calendar"></i> {dayjs(note.date).format('DD/MM/YYYY')}
              </p>
              <div className="space-y-2" dangerouslySetInnerHTML={{ __html: prepareBody(note.body) }} />
            </div>
          )),
        )}
      {isFetchingNextPage && <div className="text-center">Đang tải thêm...</div>}
    </div>
  );
}
