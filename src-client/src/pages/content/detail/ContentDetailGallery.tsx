import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';

import Modal from '~/components/Modal';
import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailGallery() {
  const { id: contentId } = useParams<{ id: string }>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data } = useFindOneContentQuery(Number(contentId));
  const screenshots = useMemo(() => data?.screenshots ?? [], [data]);

  useEffect(() => {
    if (!modalRef.current?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % screenshots.length);
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalRef.current?.open, screenshots.length]);

  const openAt = (idx: number) => {
    setActiveIndex(idx);
    modalRef.current?.showModal();
  };
  const prev = () => setActiveIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
  const next = () => setActiveIndex((i) => (i + 1) % screenshots.length);

  return (
    <div className="flex-1 p-2 bg-base-100 rounded-box overflow-y-auto">
      {screenshots.length ? (
        <div className="grid grid-cols-2 gap-2">
          {screenshots.map((s, idx) => (
            <button
              key={s.url + idx}
              className="relative group rounded-box overflow-hidden border border-base-200 cursor-pointer"
              onClick={() => openAt(idx)}
              aria-label={`Open image ${idx + 1}`}
            >
              <img
                src={s.thumbnailUrl}
                alt={s.title}
                className="w-full h-40 object-contain bg-base-200"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <i className="fa-light fa-images text-4xl text-base-content/50 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">Gallery</h3>
          <p className="text-base-content/70">No screenshots available</p>
        </div>
      )}

      <Modal
        ref={modalRef}
        title={screenshots[activeIndex]?.title || 'Gallery'}
        titlePosition="center"
        btnShow={false}
        backdropClose={true}
        iconClose={true}
        width="95vw"
        classNameContent="p-2 max-h-[80vh] overflow-hidden"
      >
        {screenshots[activeIndex] && (
          <div className="relative flex items-center justify-center mt-2">
            <img
              src={screenshots[activeIndex].url}
              alt={screenshots[activeIndex].title}
              className="w-auto h-auto max-w-[90vw] max-h-[80vh] object-contain rounded-box"
            />
            {screenshots.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <button className="btn btn-circle btn-ghost" onClick={prev} aria-label="Previous image">
                  <i className="fa-regular fa-chevron-left text-xl"></i>
                </button>
                <button className="btn btn-circle btn-ghost" onClick={next} aria-label="Next image">
                  <i className="fa-regular fa-chevron-right text-xl"></i>
                </button>
              </div>
            )}
          </div>
        )}
        {screenshots.length > 1 && (
          <div className="text-center text-xs mt-2">
            {activeIndex + 1} / {screenshots.length}
          </div>
        )}
      </Modal>
    </div>
  );
}
