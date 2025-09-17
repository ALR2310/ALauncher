import { useQuery } from '@tanstack/react-query';

import { findAllWorld } from '~/api/world.api';

export const useLauncherWorld = () => {
  const findAllWorldQuery = (instanceId?: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['worlds', instanceId],
      queryFn: () => findAllWorld({ instanceId }),
    });
  };

  return { findAllWorldQuery };
};
