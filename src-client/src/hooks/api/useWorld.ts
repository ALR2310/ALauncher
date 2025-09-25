import { useQuery } from '@tanstack/react-query';

import { findAllWorld } from '~/api';

export function useFindAllWorldQuery(instanceId?: string) {
  return useQuery({
    queryKey: ['worlds', instanceId],
    queryFn: () => findAllWorld({ instanceId }),
  });
}
