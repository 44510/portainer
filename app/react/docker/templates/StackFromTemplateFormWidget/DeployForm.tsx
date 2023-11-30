import { useRouter } from '@uirouter/react';
import { Formik, Form } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateStack } from '@/react/common/stacks/queries/useCreateStack/useCreateStack';
import { EnvVarsFieldset } from '@/react/edge/templates/AppTemplatesView/EnvVarsFieldset';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { NameField } from '@/react/common/stacks/CreateView/NameField';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';

import { useSwarmId } from '../../proxy/queries/useSwarm';

import { FormValues } from './types';
import { useValidation } from './useValidation';

export function DeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const router = useRouter();
  const { user, isAdmin } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const swarmIdQuery = useSwarmId(environmentId);
  const mutation = useCreateStack();
  const validation = useValidation();

  const initialValues: FormValues = {
    name: template.Name || '',
    envVars:
      Object.fromEntries(template.Env?.map((env) => [env.name, env.value])) ||
      {},
    accessControl: parseAccessControlFormData(isAdmin, user.Id),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      {({ values, errors, setFieldValue, isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField
              value={values.name}
              onChange={(v) => setFieldValue('name', v)}
              errors={errors.name}
            />

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

          <FormActions
            isLoading={mutation.isLoading}
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

  function handleSubmit(values: FormValues) {
    const type =
      template.Type === TemplateType.ComposeStack ? 'standalone' : 'swarm';
    const payload = {
      name: values.name,
      environmentId,

      env: Object.entries(values.envVars).map(([name, value]) => ({
        name,
        value,
      })),
      swarmId: swarmIdQuery.data || '',
      git: {
        RepositoryURL: template.Repository.url,
        ComposeFilePathInRepository: template.Repository.stackfile,
      },
    };

    return mutation.mutate(
      {
        type,
        method: 'git',
        payload,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Stack created');
          router.stateService.go('docker.stacks');
        },
      }
    );
  }
}
