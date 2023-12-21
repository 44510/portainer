import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DeployWidget } from '@/react/portainer/templates/components/DeployWidget';

import { DeployForm } from './DeployForm';

export function ContainerFromTemplateWidget({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  return (
    <DeployWidget
      logo={template.Logo}
      note={template.Note}
      title={template.Title}
    >
      <DeployForm template={template} unselect={unselect} />
    </DeployWidget>
  );
}
