import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';

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

export default function ReleaseNotePage() {
  const divRef = useRef<HTMLDivElement>(null);

  const [releases, setReleases] = useState<ReleaseNoteDetails[]>([]);
  const [offset] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const limit = 5;

  const listQuery = useQuery({
    queryKey: ['release-notes'],
    queryFn: async () => {
      const res = await axios.get(`${API}javaPatchNotes.json`);
      return res.data as ReleaseNote;
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (entry: ReleaseNoteEntry) => {
      const res = await axios.get(`${API}${entry.contentPath}`);
      return res.data as ReleaseNoteDetails;
    },
  });

  useEffect(() => {
    if (listQuery.isLoading || !listQuery.data) return;
    const list = listQuery.data.entries.filter((entry) => entry.type === 'release');
    const entries = list.slice(offset, offset + limit);

    entries.forEach((entry) => {
      releaseMutation.mutateAsync(entry).then((data) => {
        setReleases((prev) => [...prev, data]);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery.data, listQuery.isLoading]);

  useEffect(() => {
    if (!divRef.current) return;
    const layoutEl = document.getElementById('layout')!;
    const dockEl = document.getElementById('dockNavbar');
    const sideEl = document.getElementById('sidebar');

    let divHeight = 0;
    let divWidth = 0;
    // Calculate available height
    if (dockEl) divHeight = layoutEl.offsetHeight - dockEl.offsetHeight;
    // Calculate available width
    if (sideEl) divWidth = layoutEl.offsetWidth - sideEl.offsetWidth;

    divRef.current.style.height = `${divHeight}px`;
    divRef.current.style.width = `${divWidth}px`;

    setIsReady(true);
  }, []);

  return (
    <div ref={divRef} className="h-full w-full p-4 space-y-4 overflow-auto 1no-scrollbar">
      {!isReady ? (
        <div>loading...</div>
      ) : (
        <React.Fragment>
          {releases.map((release) => (
            <div key={release.version} className="overflow-hidden space-y-2 text-wrap">
              <h1 className="font-bold text-2xl">{release.title}</h1>
              <p className="text-base-content/50 font-semibold">
                <i className="fa-light fa-calendar"></i> {dayjs(release.date).format('DD/MM/YYYY')}
              </p>
              <div className="space-y-2" dangerouslySetInnerHTML={{ __html: prepareBody(release.body) }} />
            </div>
          ))}
        </React.Fragment>
      )}
    </div>
  );
}
