import { useMemo } from 'react';
import { object, array, string } from 'yup';

import { useStacks } from '@/react/common/stacks/queries/useStacks';
import { useCurrentUser } from '@/react/hooks/useUser';
import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { nameValidation } from '@/react/common/stacks/CreateView/NameField';

export function useValidation() {
  const { isAdmin } = useCurrentUser();
  const stacksQuery = useStacks();

  return useMemo(
    () =>
      object({
        name: nameValidation(stacksQuery.data || []),
        accessControl: accessControlFormValidation(isAdmin),
        envVars: array()
          .transform((_, orig) => Object.values(orig))
          .of(string().required('Required')),
      }),
    [isAdmin, stacksQuery.data]
  );
}
