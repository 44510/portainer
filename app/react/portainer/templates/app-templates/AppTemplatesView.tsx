import { useParamState } from '@/react/hooks/useParamState';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';

import { PageHeader } from '@@/PageHeader';

import { TemplateType } from './types';
import { useAppTemplates } from './queries/useAppTemplates';
import { AppTemplatesList } from './AppTemplatesList';
import { DeployForm } from './DeployFormWidget/DeployFormWidget';

export function AppTemplatesView() {
  const [selectedTemplateId, setSelectedTemplateId] = useParamState<number>(
    'template',
    (param) => (param ? parseInt(param, 10) : 0)
  );
  const templatesQuery = useAppTemplates();
  const selectedTemplate = selectedTemplateId
    ? templatesQuery.data?.find(
        (template) => template.Id === selectedTemplateId
      )
    : undefined;

  const { disabledTypes, fixedCategories, tableKey } = useViewFilter();

  return (
    <>
      <PageHeader title="Application templates list" breadcrumbs="Templates" />
      {selectedTemplate && (
        <DeployForm
          template={selectedTemplate}
          unselect={() => setSelectedTemplateId()}
        />
      )}

      <AppTemplatesList
        templates={templatesQuery.data}
        selectedId={selectedTemplateId}
        onSelect={(template) => setSelectedTemplateId(template.Id)}
        disabledTypes={disabledTypes}
        fixedCategories={fixedCategories}
        storageKey={tableKey}
      />
    </>
  );
}

function useViewFilter() {
  const envId = useEnvironmentId(false);
  const envInfoQuery = useInfo(envId);
  const apiVersion = useApiVersion(envId);
  if (!envId) {
    // edge
    return {
      disabledTypes: [TemplateType.Container],
      fixedCategories: ['edge'],
      tableKey: 'edge-app-templates',
    };
  }

  const showSwarmStacks =
    apiVersion >= 1.25 &&
    envInfoQuery.data &&
    envInfoQuery.data.Swarm &&
    envInfoQuery.data.Swarm.NodeID &&
    envInfoQuery.data.Swarm.ControlAvailable;

  return {
    disabledTypes: !showSwarmStacks ? [TemplateType.SwarmStack] : [],
    tableKey: 'docker-app-templates',
  };
}
