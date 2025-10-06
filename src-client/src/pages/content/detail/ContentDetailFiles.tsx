import { useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailFiles() {
  const { slug } = useParams<{ slug: string }>();
  const { isLoading } = useFindOneContentQuery(slug!);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <i className="fa-light fa-folder-open text-4xl text-base-content/50 mb-4"></i>
        <h3 className="text-lg font-semibold mb-2">Files</h3>
        <p className="text-base-content/70">File listing will be implemented here</p>
      </div>
    );
  }
}
