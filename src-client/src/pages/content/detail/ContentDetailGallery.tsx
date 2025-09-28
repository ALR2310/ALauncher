import { useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailGallery() {
  const { id: contentId } = useParams<{ id: string }>();

  const { data } = useFindOneContentQuery(Number(contentId));

  return (
    <div className="flex-1 p-2 bg-base-100 rounded-box overflow-y-auto">
      <div className="text-center py-8">
        <i className="fa-light fa-images text-4xl text-base-content/50 mb-4"></i>
        <h3 className="text-lg font-semibold mb-2">Gallery</h3>
        <p className="text-base-content/70">Image gallery will be implemented here</p>
      </div>
    </div>
  );
}
