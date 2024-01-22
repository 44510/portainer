import { UserId } from '@/portainer/users/types';
import { useCurrentUser } from '@/react/hooks/useUser';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { Link } from '@@/Link';
import { FormError } from '@@/form-components/FormError';

export function TemplateLoadError({
  templateId,
  creatorId,
}: {
  templateId: CustomTemplate['Id'];
  creatorId: UserId;
}) {
  const { isAdmin, user } = useCurrentUser();
  const isAdminOrWriter = isAdmin || user.Id === creatorId;
  return (
    <FormError>
      {isAdminOrWriter ? (
        <>
          Custom template could not be loaded, please{' '}
          <Link to=".edit" params={{ id: templateId }}>
            click here
          </Link>{' '}
          for configuration
        </>
      ) : (
        <>
          Custom template could not be loaded, please contact your
          administrator.
        </>
      )}
    </FormError>
  );
}
