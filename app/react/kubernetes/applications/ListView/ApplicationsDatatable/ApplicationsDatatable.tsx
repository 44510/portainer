import { useEffect } from 'react';
import { BoxIcon } from 'lucide-react';

import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import {
  useAuthorizations,
  useIsEnvironmentAdmin,
} from '@/react/hooks/useUser';

import { TableSettingsMenu } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { AddButton } from '@@/buttons';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';

import { NamespaceFilter } from '../ApplicationsStacksDatatable/NamespaceFilter';
import { Namespace } from '../ApplicationsStacksDatatable/types';

import { Application, ConfigKind } from './types';
import { useColumns } from './useColumns';
import { getPublishedUrls } from './PublishedPorts';
import { SubRow } from './SubRow';
import { HelmInsightsBox } from './HelmInsightsBox';

export function ApplicationsDatatable({
  dataset,
  onRefresh,
  isLoading,
  onRemove,
  namespace = '',
  namespaces,
  onNamespaceChange,
  showSystem,
  onShowSystemChange,
  hideStacks,
}: {
  dataset: Array<Application>;
  onRefresh: () => void;
  isLoading: boolean;
  onRemove: (selectedItems: Application[]) => void;
  namespace?: string;
  namespaces: Array<Namespace>;
  onNamespaceChange(namespace: string): void;
  showSystem?: boolean;
  onShowSystemChange(showSystem: boolean): void;
  hideStacks: boolean;
}) {
  const envId = useEnvironmentId();
  const envQuery = useCurrentEnvironment();
  const namespaceMetaListQuery = useNamespacesQuery(envId);
  const isEnvironmentAdmin = useIsEnvironmentAdmin({ adminOnlyCE: false });

  const tableState = useKubeStore('kubernetes.applications', 'Name');
  useRepeater(tableState.autoRefreshRate, onRefresh);

  const hasWriteAuth = useAuthorizations('K8sApplicationsW', undefined, true);

  const { setShowSystemResources } = tableState;

  useEffect(() => {
    setShowSystemResources(showSystem || false);
  }, [showSystem, setShowSystemResources]);

  const columns = useColumns(hideStacks);

  const filteredDataset = !showSystem
    ? dataset.filter(
        (item) => !namespaceMetaListQuery.data?.[item.ResourcePool]?.IsSystem
      )
    : dataset;

  return (
    <ExpandableDatatable
      noWidget
      dataset={filteredDataset}
      settingsManager={tableState}
      columns={columns}
      title="Applications"
      titleIcon={BoxIcon}
      isLoading={isLoading}
      disableSelect={!hasWriteAuth}
      isRowSelectable={(row) =>
        !namespaceMetaListQuery.data?.[row.original.ResourcePool]?.IsSystem
      }
      getRowCanExpand={(row) =>
        isExpandable(
          row.original,
          envQuery.data?.Kubernetes.Configuration.RestrictSecrets || false,
          isEnvironmentAdmin
        )
      }
      renderSubRow={(row) => (
        <SubRow item={row.original} hideStacks={hideStacks} />
      )}
      renderTableActions={(selectedItems) =>
        hasWriteAuth && (
          <>
            <DeleteButton
              disabled={selectedItems.length === 0}
              confirmMessage="Do you want to remove the selected application(s)?"
              onConfirmed={() => onRemove(selectedItems)}
            />

            <AddButton color="secondary">Add with form</AddButton>

            <CreateFromManifestButton />
          </>
        )
      }
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings
            settings={tableState}
            onShowSystemChange={onShowSystemChange}
          />
        </TableSettingsMenu>
      )}
      description={
        <div className="w-full">
          <div className="min-w-[140px] float-right">
            <NamespaceFilter
              namespaces={namespaces}
              value={namespace}
              onChange={onNamespaceChange}
              showSystem={tableState.showSystemResources}
            />
          </div>

          <div className="space-y-2">
            <SystemResourceDescription
              showSystemResources={tableState.showSystemResources}
            />

            <div className="w-fit">
              <HelmInsightsBox />
            </div>
          </div>
        </div>
      }
    />
  );
}

function isExpandable(
  item: Application,
  restrictSecrets: boolean,
  isEnvironmentAdmin: boolean
) {
  if (item.KubernetesApplications || getPublishedUrls(item).length) {
    return true;
  }

  return !!(
    (!restrictSecrets || isEnvironmentAdmin) &&
    hasConfigurationSecrets(item)
  );
}

function hasConfigurationSecrets(item: Application) {
  return (
    item.Configurations &&
    item.Configurations.some(
      (config) => config.Data && config.Kind === ConfigKind.Secret
    )
  );
}
