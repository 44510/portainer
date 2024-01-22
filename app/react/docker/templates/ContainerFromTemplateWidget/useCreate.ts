import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';

import { useCreateOrReplaceMutation } from '../../containers/CreateView/useCreateMutation';

import { FormValues } from './types';
import { createContainerConfiguration } from './createContainerConfig';
import { useCreateLocalVolumes } from './useCreateLocalVolumes';

export function useCreate(template: TemplateViewModel) {
  const router = useRouter();
  const createVolumesMutation = useCreateLocalVolumes();
  const createContainerMutation = useCreateOrReplaceMutation();
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  return {
    onSubmit,
    isLoading:
      createVolumesMutation.isLoading || createContainerMutation.isLoading,
  };

  function onSubmit(values: FormValues) {
    const autoVolumesCount = values.volumes.filter(
      (v) => v.type === 'volume' && v.name === 'auto'
    ).length;
    createVolumesMutation.mutate(autoVolumesCount, {
      onSuccess(autoVolumes) {
        let index = 0;
        const volumes = values.volumes.map((v) =>
          v.type === 'volume' && v.name === 'auto'
            ? { ...v, name: autoVolumes[index++].Name }
            : v
        );

        createContainerMutation.mutate(
          {
            config: createContainerConfiguration(template, {
              ...values,
              volumes,
            }),
            values: {
              name: values.name,
              accessControl: values.accessControl,
              imageName: template.RegistryModel.Image,
              alwaysPull: true,
            },
            environment,
          },
          {
            onSuccess() {
              notifySuccess('Success', 'Container successfully created');
              router.stateService.go('docker.containers');
            },
          }
        );
      },
    });
  }
}
