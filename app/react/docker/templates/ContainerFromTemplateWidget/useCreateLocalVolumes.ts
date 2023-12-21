import { useMutation } from 'react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { createVolume } from '../../volumes/queries/useCreateVolume';

export function useCreateLocalVolumes() {
  const environmentId = useEnvironmentId();

  return useMutation(async (count: number) =>
    Promise.all(
      Array.from({ length: count }).map(() =>
        createVolume(environmentId, { Driver: 'local' })
      )
    )
  );
}
