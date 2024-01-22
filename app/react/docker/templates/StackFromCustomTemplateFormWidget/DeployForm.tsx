import { useRouter } from '@uirouter/react';
import { Formik, Form } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  CreateStackPayload,
  useCreateStack,
} from '@/react/common/stacks/queries/useCreateStack/useCreateStack';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { NameField } from '@/react/common/stacks/CreateView/NameField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import {
  isTemplateVariablesEnabled,
  renderTemplate,
} from '@/react/portainer/custom-templates/components/utils';
import {
  CustomTemplatesVariablesField,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { StackType } from '@/react/common/stacks/types';
import { toGitFormModel } from '@/react/portainer/gitops/types';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { WebEditorForm } from '@@/WebEditorForm';

import { useSwarmId } from '../../proxy/queries/useSwarm';
import { AdvancedSettings } from '../AdvancedSettings';

import { FormValues } from './types';
import { useValidation } from './useValidation';

export function DeployForm({
  template,
  unselect,
  templateFile,
}: {
  template: CustomTemplate;
  templateFile: string;
  unselect: () => void;
}) {
  const router = useRouter();
  const { user, isAdmin } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const swarmIdQuery = useSwarmId(environmentId);
  const mutation = useCreateStack();
  const validation = useValidation(template.Variables);

  const isGit = !!template.GitConfig;

  const initialValues: FormValues = {
    name: template.Title || '',
    variables: getVariablesFieldDefaultValues(template.Variables),
    accessControl: parseAccessControlFormData(isAdmin, user.Id),
    fileContent: templateFile,
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
          </FormSection>

          {isTemplateVariablesEnabled && (
            <CustomTemplatesVariablesField
              definitions={template.Variables}
              onChange={(v) => {
                setFieldValue('variables', v);
                const newFile = renderTemplate(
                  templateFile,
                  v,
                  template.Variables
                );
                setFieldValue('fileContent', newFile);
              }}
              value={values.variables}
              errors={errors.variables}
            />
          )}

          <AdvancedSettings
            label={(isOpen) => advancedSettingsLabel(isOpen, isGit)}
          >
            <WebEditorForm
              id="custom-template-creation-editor"
              value={values.fileContent}
              onChange={(value) => {
                if (isGit) {
                  return;
                }
                setFieldValue('fileContent', value);
              }}
              yaml
              error={errors.fileContent}
              placeholder="Define or paste the content of your docker compose file here"
              readonly={isGit}
            >
              <p>
                You can get more information about Compose file format in the{' '}
                <a
                  href="https://docs.docker.com/compose/compose-file/"
                  target="_blank"
                  rel="noreferrer"
                >
                  official documentation
                </a>
                .
              </p>
            </WebEditorForm>
          </AdvancedSettings>

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
    const payload = getPayload(values);

    return mutation.mutate(payload, {
      onSuccess() {
        notifySuccess('Success', 'Stack created');
        router.stateService.go('docker.stacks');
      },
    });
  }

  function getPayload(values: FormValues): CreateStackPayload {
    const type =
      template.Type === StackType.DockerCompose ? 'standalone' : 'swarm';
    const isGit = !!template.GitConfig;
    if (isGit) {
      return type === 'standalone'
        ? {
            type,
            method: 'git',
            payload: {
              name: values.name,
              environmentId,
              git: toGitFormModel(template.GitConfig),
            },
          }
        : {
            type,
            method: 'git',
            payload: {
              name: values.name,
              environmentId,
              swarmId: swarmIdQuery.data || '',
              git: toGitFormModel(template.GitConfig),
            },
          };
    }

    return type === 'standalone'
      ? {
          type,
          method: 'string',
          payload: {
            name: values.name,
            environmentId,
            fileContent: values.fileContent,
          },
        }
      : {
          type,
          method: 'string',
          payload: {
            name: values.name,
            environmentId,
            swarmId: swarmIdQuery.data || '',
            fileContent: values.fileContent,
          },
        };
  }
}

function advancedSettingsLabel(isOpen: boolean, isGit: boolean) {
  if (isGit) {
    return isOpen ? 'Hide stack' : 'View stack';
  }

  return isOpen ? 'Hide custom stack' : 'Customize stack';
}
