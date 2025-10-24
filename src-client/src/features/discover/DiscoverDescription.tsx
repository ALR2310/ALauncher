import { FileText } from 'lucide-react';
import { useParams } from 'react-router';

import { useContentDetailQuery } from '~/hooks/api/useContentApi';

export default function DiscoverDescription() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useContentDetailQuery({ slug: slug! });

  if (!data?.description) {
    return (
      <div className="text-center py-8">
        <FileText size={40} className="mx-auto text-base-content/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-base-content/70">This mod does not have a description yet.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-[70%] m-4"></div>
        <div className="skeleton h-12 w-[90%] m-4"></div>
        <div className="skeleton h-52 w-[60%] m-4"></div>
      </div>
    );
  }

  return <div className="project-description p-4" dangerouslySetInnerHTML={{ __html: data.description }}></div>;
}
