import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DeployWidget } from '@/react/portainer/templates/components/DeployWidget';

import { TextTip } from '@@/Tip/TextTip';

import { useIsDeployable } from './useIsDeployable';
import { DeployForm } from './DeployForm';

export function StackFromTemplateFormWidget({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const isDeployable = useIsDeployable(template.Type);

  return (
    <DeployWidget
      logo={template.Logo}
      note={template.Note}
      title={template.Title}
    >
      <DeployForm template={template} unselect={unselect} />

      {!isDeployable && (
        <div className="form-group">
          <TextTip>
            This template type cannot be deployed on this environment.
          </TextTip>
        </div>
      )}
    </DeployWidget>
  );
}
