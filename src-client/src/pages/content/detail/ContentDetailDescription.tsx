import { useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailDescription() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useFindOneContentQuery(slug!);

  return <div className="project-description p-4" dangerouslySetInnerHTML={{ __html: data?.description || '' }}></div>;
}
