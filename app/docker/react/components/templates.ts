import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { StackFromTemplateFormWidget } from '@/react/docker/templates/StackFromTemplateFormWidget';
import { StackFromCustomTemplateFormWidget } from '@/react/docker/templates/StackFromCustomTemplateFormWidget';
import { ContainerFromTemplateWidget } from '@/react/docker/templates/ContainerFromTemplateWidget';

export const templatesModule = angular
  .module('portainer.docker.react.components.templates', [])
  .component(
    'stackFromTemplateFormWidget',
    r2a(withUIRouter(withCurrentUser(StackFromTemplateFormWidget)), [
      'template',
      'unselect',
    ])
  )
  .component(
    'stackFromCustomTemplateFormWidget',
    r2a(withUIRouter(withCurrentUser(StackFromCustomTemplateFormWidget)), [
      'template',
      'unselect',
    ])
  )
  .component(
    'containerFromAppTemplateFormWidget',
    r2a(withUIRouter(withCurrentUser(ContainerFromTemplateWidget)), [
      'template',
      'unselect',
    ])
  ).name;
