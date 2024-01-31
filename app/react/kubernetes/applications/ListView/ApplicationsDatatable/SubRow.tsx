import clsx from 'clsx';

import { useAuthorizations, useCurrentUser } from '@/react/hooks/useUser';

import { ConfigurationDetails } from './ConfigurationDetails';
import { InnerTable } from './InnerTable';
import { PublishedPorts } from './PublishedPorts';
import { Application } from './types';

export function SubRow({
  item,
  hideStacks,
  areSecretsRestricted,
}: {
  item: Application;
  hideStacks: boolean;
  areSecretsRestricted: boolean;
}) {
  const {
    user: { Username: username },
  } = useCurrentUser();
  const isEnvironmentAdmin = useAuthorizations(['K8sResourcePoolsW']);

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
            <ConfigurationDetails
              item={item}
              isEnvironmentAdmin={isEnvironmentAdmin}
              areSecretsRestricted={areSecretsRestricted}
              username={username}
            />
          </>
        )}
      </td>
    </tr>
  );
}
