import { ContentResponseDto } from '@shared/dtos/content.dto';
import { categoryMap, loaderMap } from '@shared/mappings/general.mapping';
import { abbreviateNumber, capitalize } from '@shared/utils/general.utils';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { toast } from '~/hooks/useToast';

interface ContentCardProps {
  data: ContentResponseDto['data'][0];
  categoryType: string;
  versionSelected: string;
  loaderType: string;
}

export default function ContentCard({ data, categoryType, versionSelected, loaderType }: ContentCardProps) {
  const { instanceId } = useParams<{ instanceId: string }>();
  const evtRef = useRef<EventSource | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'Install' | 'Installing' | 'Installed'>('Install');

  useEffect(() => {
    if (data.status === 'latest') {
      setStatus('Installed');
    }
  }, [data.status]);

  const handleInstall = () => {
    const query = new URLSearchParams({
      name: data.name,
      author: data.authors[0].name ?? 'Unknown',
      logoUrl: data.logoUrl,
    });
    const type = categoryMap.keyToText[categoryType].toLowerCase().replace(' ', '-');
    const url = `http://localhost:${import.meta.env.VITE_SERVER_PORT}/api/instances/${instanceId}/${type}/${data.id}?${query.toString()}`;

    evtRef.current = new EventSource(url);
    setStatus('Installing');
    setIsDownloading(true);

    evtRef.current.addEventListener('progress', (e) => {
      setProgress(parseFloat(e.data));
    });
    evtRef.current.addEventListener('done', () => {
      setIsDownloading(false);
      setStatus('Installed');
      setProgress(100);
      evtRef?.current?.close();
    });
    evtRef.current.addEventListener('error', () => {
      setIsDownloading(false);
      toast.error('Failed to install. Please try again.');
      setStatus('Install');
      evtRef?.current?.close();
    });
  };

  useEffect(() => {
    return () => {
      evtRef.current?.close();
    };
  }, []);

  return (
    <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
      <div className="flex justify-center items-center ">
        <img src={data.logoUrl} alt="mod img" loading="lazy" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex">
          <div className="flex-1">
            <div className="flex items-center font-semibold">
              <h3 className="text-base-content text-ellipsis-1">{data.name}</h3>
              <div className="divider divider-horizontal"></div>
              <p className="text-base-content/60 text-nowrap">by {data.authors[0].name}</p>
            </div>

            <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">{data.summary}</p>
          </div>

          <div className="w-[15%]">
            <button
              className={`btn btn-soft w-full ${status === 'Installed' ? 'btn-success pointer-events-none' : 'btn-primary'}`}
              onClick={handleInstall}
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
  );
}
