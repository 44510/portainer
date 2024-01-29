import clsx from 'clsx';

import { ConfigurationDetails } from './ConfigurationDetails';
import { InnerTable } from './InnerTable';
import { PublishedPorts } from './PublishedPorts';
import { Application } from './types';

export function SubRow({
  item,
  hideStacks,
}: {
  item: Application;
  hideStacks: boolean;
}) {
  return (
    <tr className={clsx({ 'secondary-body': !item.KubernetesApplications })}>
      <td />
      <td colSpan={8} className="datatable-padding-vertical">
        {item.KubernetesApplications ? (
          <InnerTable
            dataset={item.KubernetesApplications}
            hideStacks={hideStacks}
          />
        ) : (
          <>
            <PublishedPorts item={item} />
            <ConfigurationDetails item={item} />
          </>
        )}
      </td>
    </tr>
  );
}
