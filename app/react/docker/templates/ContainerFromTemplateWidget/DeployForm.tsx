import { Formik, Form } from 'formik';

import { EnvVarsFieldset } from '@/react/edge/templates/AppTemplatesView/EnvVarsFieldset';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';

import { NameField } from '../../containers/CreateView/BaseForm/NameField';
import { NetworkSelector } from '../../containers/components/NetworkSelector';
import { AdvancedSettings } from '../AdvancedSettings';
import { PortsMappingField } from '../../containers/CreateView/BaseForm/PortsMappingField';
import { VolumesTab } from '../../containers/CreateView/VolumesTab';
import { HostsFileEntries } from '../../containers/CreateView/NetworkTab/HostsFileEntries';
import { LabelsTab } from '../../containers/CreateView/LabelsTab';
import { HostnameField } from '../../containers/CreateView/NetworkTab/HostnameField';

import { useValidation } from './useValidation';
import { FormValues } from './types';
import { useCreate } from './useCreate';

export function DeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const { user, isAdmin } = useCurrentUser();
  const environmentId = useEnvironmentId();

  const validation = useValidation(isAdmin);

  const createMutation = useCreate(template);

  if (!createMutation) {
    return null;
  }

  const initialValues: FormValues = {
    name: template.Name || '',
    envVars:
      Object.fromEntries(template.Env?.map((env) => [env.name, env.value])) ||
      {},
    accessControl: parseAccessControlFormData(isAdmin, user.Id),
    hostname: '',
    hosts: [],
    labels: [],
    network: '',
    ports: template.Ports.map((p) => ({ ...p, hostPort: p.hostPort || '' })),
    volumes: template.Volumes.map((v) => ({
      containerPath: v.container,
      type: v.type === 'bind' ? 'bind' : 'volume',
      readOnly: v.readonly,
      name: v.type === 'bind' ? v.bind || '' : 'auto',
    })),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={createMutation.onSubmit}
      validationSchema={validation}
      validateOnMount
    >
      {({ values, errors, setFieldValue, isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField
              value={values.name}
              onChange={(v) => setFieldValue('name', v)}
              error={errors.name}
            />

            <FormControl label="Network" errors={errors?.network}>
              <NetworkSelector
                value={values.network}
                onChange={(v) => setFieldValue('network', v)}
              />
            </FormControl>

            <EnvVarsFieldset
              value={values.envVars}
              onChange={(values) => setFieldValue('envVars', values)}
              errors={errors.envVars}
              options={template.Env || []}
            />
          </FormSection>

          <AccessControlForm
            formNamespace="accessControl"
            onChange={(values) => setFieldValue('accessControl', values)}
            values={values.accessControl}
            errors={errors.accessControl}
            environmentId={environmentId}
          />

          <AdvancedSettings
            label={(isOpen) =>
              isOpen ? 'Hide advanced options' : 'Show advanced options'
            }
          >
            <PortsMappingField
              value={values.ports}
              onChange={(v) => setFieldValue('ports', v)}
              errors={errors.ports}
            />

            <VolumesTab
              onChange={(v) => setFieldValue('volumes', v)}
              values={values.volumes}
              errors={errors.volumes}
              allowAuto
            />

            <HostsFileEntries
              values={values.hosts}
              onChange={(v) => setFieldValue('hosts', v)}
              errors={errors?.hosts}
            />

            <LabelsTab
              values={values.labels}
              onChange={(v) => setFieldValue('labels', v)}
              errors={errors?.labels}
            />

            <HostnameField
              value={values.hostname}
              onChange={(v) => setFieldValue('hostname', v)}
              error={errors.hostname}
            />
          </AdvancedSettings>

          <FormActions
            isLoading={createMutation.isLoading}
            isValid={isValid}
            loadingText="Deployment in progress..."
            submitLabel="Deploy the stack"
          >
            <Button type="reset" onClick={() => unselect()} color="default">
              Hide
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );
}
