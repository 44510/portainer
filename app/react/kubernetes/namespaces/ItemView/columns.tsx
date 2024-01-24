import { createColumnHelper } from '@tanstack/react-table';

import { humanize, truncate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { isExternalApplication } from '../../applications/utils';
import { cpuValue } from '../../applications/utils/cpuValue';

import { NamespaceApp } from './types';

const columnHelper = createColumnHelper<NamespaceApp>();

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    cell: ({ row: { original: item } }) => (
      <>
        <Link
          to="kubernetes.applications.application"
          params={{ name: item.Name, namespace: item.ResourcePool }}
        >
          {item.Name}
        </Link>
        {isExternalApplication({ metadata: item.Metadata }) && (
          <Badge type="info">external</Badge>
        )}
      </>
    ),
  }),
  columnHelper.accessor('StackName', {
    header: 'Stack Name',
    cell: ({ getValue }) => getValue() || '-',
  }),
  columnHelper.accessor('Image', {
    header: 'Image',
    cell: ({ row: { original: item } }) => (
      <>
        {truncate(item.Image, 64)}
        {item.Containers?.length > 1 && <>+ {item.Containers.length - 1}</>}
      </>
    ),
  }),
  columnHelper.accessor('CPU', {
    header: 'CPU',
    cell: ({ getValue }) => cpuValue(getValue()),
  }),
  columnHelper.accessor('Memory', {
    header: 'Memory',
    cell: ({ getValue }) => humanize(getValue()),
  }),
];
