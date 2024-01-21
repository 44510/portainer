// actions:

import { Layers } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { useRepeater } from '@@/datatables/useRepeater';
import { AddButton } from '@@/buttons';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';

import { NamespaceViewModel } from './types';
import { useColumns } from './columns/useColumns';

export function NamespacesDatatable({
  dataset,
  onRemove,
  onRefresh,
}: {
  dataset: Array<NamespaceViewModel>;
  onRemove(items: Array<NamespaceViewModel>): void;
  onRefresh(): void;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-namespaces',
    'Name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const hasWriteAuth = useAuthorizations('K8sResourcePoolDetailsW');
  const columns = useColumns();
  useRepeater(tableState.autoRefreshRate, onRefresh);

  const filteredDataset = tableState.showSystemResources
    ? dataset
    : dataset.filter(
        (item) =>
          !KubernetesNamespaceHelper.isSystemNamespace(item.Namespace.Name)
      );

  return (
    <Datatable
      data-cy="k8sNamespace-namespaceTable"
      dataset={filteredDataset}
      columns={columns}
      settingsManager={tableState}
      title="Namespaces"
      titleIcon={Layers}
      getRowId={(item) => item.Namespace.Id}
      isRowSelectable={({ original: item }) =>
        hasWriteAuth &&
        !(
          KubernetesNamespaceHelper.isSystemNamespace(item.Namespace.Name) ||
          KubernetesNamespaceHelper.isDefaultNamespace(item.Namespace.Name)
        )
      }
      renderTableActions={(selectedItems) => (
        <Authorized authorizations="K8sResourcePoolDetailsW">
          <DeleteButton
            onClick={() => onRemove(selectedItems)}
            disabled={selectedItems.length === 0}
          />

          <AddButton color="secondary">Add with form</AddButton>

          <CreateFromManifestButton />
        </Authorized>
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
    />
  );
}
