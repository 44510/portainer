import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { Application } from './types';
import { useBaseColumns } from './useColumns';

export function InnerTable({
  dataset,
  hideStacks,
}: {
  dataset: Array<Application>;
  // tableKey: string;
  hideStacks: boolean;
}) {
  const columns = useBaseColumns(hideStacks);

  return <NestedDatatable dataset={dataset} columns={columns} />;
}
