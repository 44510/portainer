import { useMemo } from 'react';
import { object, string } from 'yup';

import { useStacks } from '@/react/common/stacks/queries/useStacks';
import { useCurrentUser } from '@/react/hooks/useUser';
import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { nameValidation } from '@/react/common/stacks/CreateView/NameField';
import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';

export function useValidation(variableDefs: Array<VariableDefinition>) {
  const { isAdmin } = useCurrentUser();
  const stacksQuery = useStacks();

  return useMemo(
    () =>
      object({
        name: nameValidation(stacksQuery.data || []),
        accessControl: accessControlFormValidation(isAdmin),
        fileContent: string().required('Required'),
        variables: variablesFieldValidation(variableDefs),
      }),
    [isAdmin, stacksQuery.data, variableDefs]
  );
}
