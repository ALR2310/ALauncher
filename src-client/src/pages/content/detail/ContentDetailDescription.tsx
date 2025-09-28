import { useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';

export default function ContentDetailDescription() {
  const { id } = useParams<{ id: string }>();
  const { data } = useFindOneContentQuery(Number(id));

  return <div className="project-description p-4" dangerouslySetInnerHTML={{ __html: data?.description || '' }}></div>;
}
