// actions:

import { Database } from 'lucide-react';

import { useAuthorizations } from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';
import KubernetesVolumeHelper from '@/kubernetes/helpers/volumeHelper';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { useRepeater } from '@@/datatables/useRepeater';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';

import { VolumeViewModel } from './types';
import { columns } from './column';
import { isSystemVolume } from './isSystemVolume';

export function VolumesDatatable({
  dataset,
  onRemove,
  onRefresh,
}: {
  dataset: Array<VolumeViewModel>;
  onRemove(items: Array<VolumeViewModel>): void;
  onRefresh(): void;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes',
    'Name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const hasWriteAuth = useAuthorizations('K8sVolumesW', undefined, true);

  useRepeater(tableState.autoRefreshRate, onRefresh);

  const filteredDataset = tableState.showSystemResources
    ? dataset
    : dataset.filter((item) => !isSystemVolume(item));

  return (
    <Datatable
      noWidget
      data-cy="k8s-volumes-datatable"
      dataset={filteredDataset}
      columns={columns}
      settingsManager={tableState}
      title="Volumes"
      titleIcon={Database}
      isRowSelectable={({ original: item }) =>
        hasWriteAuth &&
        !(
          KubernetesNamespaceHelper.isSystemNamespace(
            item.ResourcePool.Namespace.Name
          ) && !KubernetesVolumeHelper.isUsed(item)
        )
      }
      renderTableActions={(selectedItems) => (
        <>
          <DeleteButton
            confirmMessage="Do you want to remove the selected volume(s)?"
            onConfirmed={() => onRemove(selectedItems)}
            disabled={selectedItems.length === 0}
          />
          <CreateFromManifestButton />
        </>
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
