import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';

import Modal from '~/components/Modal';
import { useContentDetailQuery } from '~/hooks/api/useContentApi';

export default function DiscoverGallery() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useContentDetailQuery({ slug: slug! });
  const modalRef = useRef<HTMLDialogElement>(null!);
  const [activeIndex, setActiveIndex] = useState(0);

  const screenshots = useMemo(() => data?.screenshots || [], [data]);

  useEffect(() => {
    if (!modalRef.current?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % screenshots.length);
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screenshots.length]);

  const openAt = (idx: number) => {
    setActiveIndex(idx);
    modalRef.current?.showModal();
  };
  const prev = () => setActiveIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
  const next = () => setActiveIndex((i) => (i + 1) % screenshots.length);

  return !screenshots.length ? (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-4">
        <Images size={36} className="text-base-content/40" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Images Available</h3>
      <p className="text-base-content/60 text-sm">This mod doesn't have any screenshots yet.</p>
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
        {screenshots.map((s, idx) => (
          <button
            key={s.url + idx}
            className="relative group overflow-hidden rounded-lg border border-base-300 hover:border-success transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success cursor-pointer"
            onClick={() => openAt(idx)}
            aria-label={`Open image ${idx + 1}`}
          >
            <div className="aspect-video bg-base-200 relative overflow-hidden">
              <img
                src={s.thumbnailUrl}
                alt={s.title}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-base-300/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-base-300 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <p className="font-semibold text-sm text-base-content line-clamp-2">{s.title}</p>
              <p className="text-xs text-base-content/60 mt-1">Click to view full size</p>
            </div>
          </button>
        ))}
      </div>

      <Modal
        ref={modalRef}
        title={screenshots[activeIndex]?.title || 'Gallery'}
        titlePosition="center"
        btnShow={false}
        backdropClose={true}
        iconClose={true}
        width="95vw"
        classNameContent="p-4 flex flex-col max-h-[85vh]"
      >
        {screenshots[activeIndex] && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="relative flex items-center justify-center bg-base-200 rounded-lg overflow-hidden flex-1 min-h-0">
              <img
                src={screenshots[activeIndex].url}
                alt={screenshots[activeIndex].title}
                className="max-w-full max-h-full object-contain"
              />

              {screenshots.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-success hover:scale-110 transition-transform"
                    onClick={prev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-success hover:scale-110 transition-transform"
                    onClick={next}
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 badge badge-lg badge-neutral gap-2">
                    <span className="font-semibold">{activeIndex + 1}</span>
                    <span className="opacity-60">/</span>
                    <span className="opacity-60">{screenshots.length}</span>
                  </div>
                </>
              )}
            </div>

            {screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar shrink-0">
                {screenshots.map((s, idx) => (
                  <button
                    key={s.url + idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'border-success scale-105 shadow-lg'
                        : 'border-base-300 hover:border-success/50 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  >
                    <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
