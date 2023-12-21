import { object, string } from 'yup';
import { useMemo } from 'react';

import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { appTemplateEnvVarValidationSchema } from '@/react/edge/templates/AppTemplatesView/EnvVarsFieldset';

import { hostnameSchema } from '../../containers/CreateView/NetworkTab/HostnameField';
import { hostFileSchema } from '../../containers/CreateView/NetworkTab/HostsFileEntries';
import { labelsTabUtils } from '../../containers/CreateView/LabelsTab';
import { nameValidation } from '../../containers/CreateView/BaseForm/NameField';
import { validationSchema as portSchema } from '../../containers/CreateView/BaseForm/PortsMappingField.validation';
import { volumesTabUtils } from '../../containers/CreateView/VolumesTab';

export function useValidation(isAdmin: boolean) {
  return useMemo(
    () =>
      object({
        accessControl: accessControlFormValidation(isAdmin),
        envVars: appTemplateEnvVarValidationSchema,
        hostname: hostnameSchema,
        hosts: hostFileSchema,
        labels: labelsTabUtils.validation(),
        name: nameValidation(),
        network: string().default(''),
        ports: portSchema(),
        volumes: volumesTabUtils.validation(),
      }),
    [isAdmin]
  );
}
