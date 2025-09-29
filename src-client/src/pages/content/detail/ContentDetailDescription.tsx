import { useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailDescription() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useFindOneContentQuery(slug!);

  if (!data?.description) {
    return (
      <div className="text-center py-8">
        <i className="fa-light fa-file-text text-4xl text-base-content/50 mb-4"></i>
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-base-content/70">No description available</p>
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
