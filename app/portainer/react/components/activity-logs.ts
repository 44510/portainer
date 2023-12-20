import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { ActivityLogsTable } from '@/react/portainer/logs/ActivityLogsView/ActivityLogsTable';

export const activityLogsModule = angular
  .module('portainer.app.react.components.activity-logs', [])
  .component(
    'activityLogsTable',
    r2a(withUIRouter(withReactQuery(ActivityLogsTable)), [
      'currentPage',
      'dataset',
      'keyword',
      'limit',
      'totalItems',
      'sort',
      'onChangeSort',
      'onChangePage',
      'onChangeLimit',
      'onChangeKeyword',
    ])
  ).name;
