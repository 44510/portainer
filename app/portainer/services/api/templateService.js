import { commandStringToArray } from '@/docker/helpers/containers';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';

angular.module('portainer.app').factory('TemplateService', TemplateServiceFactory);

/* @ngInject */
function TemplateServiceFactory($q, Templates, TemplateHelper, ImageHelper, ContainerHelper, EndpointService) {
  var service = {
    templates,
  };

  function templates(endpointId) {
    const deferred = $q.defer();

    $q.all({
      templates: Templates.query().$promise,
      registries: EndpointService.registries(endpointId),
    })
      .then(function success({ templates, registries }) {
        const version = templates.version;
        deferred.resolve(
          templates.templates.map((item) => {
            try {
              const template = new TemplateViewModel(item, version);
              const registryURL = template.RegistryModel.Registry.URL;
              const registry = registryURL ? registries.find((reg) => reg.URL === registryURL) : new DockerHubViewModel();
              template.RegistryModel.Registry = registry;
              return template;
            } catch (err) {
              deferred.reject({ msg: 'Unable to retrieve templates', err: err });
            }
          })
        );
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve templates', err: err });
      });

    return deferred.promise;
  }

  service.templateFile = templateFile;
  function templateFile(repositoryUrl, composeFilePathInRepository) {
    return Templates.file({ repositoryUrl, composeFilePathInRepository }).$promise;
  }

  service.createTemplateConfiguration = function (template, formValues) {
    var imageConfiguration = ImageHelper.createImageConfigForContainer(template.RegistryModel);
    var containerConfiguration = createContainerConfiguration(template, formValues);
    containerConfiguration.Image = imageConfiguration.fromImage;
    return containerConfiguration;
  };

  function createContainerConfiguration(template, formValues) {
    var configuration = TemplateHelper.getDefaultContainerConfiguration();
    configuration.HostConfig.NetworkMode = formValues.network;
    configuration.HostConfig.Privileged = template.Privileged;
    configuration.HostConfig.RestartPolicy = { Name: template.RestartPolicy };
    configuration.HostConfig.ExtraHosts = formValues.hosts ? formValues.hosts : [];
    configuration.name = formValues.name;
    configuration.Hostname = formValues.hostname;
    configuration.Env = TemplateHelper.EnvToStringArray(formValues.env);
    configuration.Cmd = commandStringToArray(template.Command);
    var portConfiguration = TemplateHelper.portArrayToPortConfiguration(formValues.ports);
    configuration.HostConfig.PortBindings = portConfiguration.bindings;
    configuration.ExposedPorts = portConfiguration.exposedPorts;
    var consoleConfiguration = TemplateHelper.getConsoleConfiguration(template.Interactive);
    configuration.OpenStdin = consoleConfiguration.openStdin;
    configuration.Tty = consoleConfiguration.tty;
    configuration.Labels = TemplateHelper.updateContainerConfigurationWithLabels(formValues.labels);
    return configuration;
  }

  service.updateContainerConfigurationWithVolumes = function (configuration, volumes, generatedVolumesPile) {
    TemplateHelper.createVolumeBindings(volumes, generatedVolumesPile);
    volumes.forEach(function (volume) {
      if (volume.binding) {
        configuration.Volumes[volume.container] = {};
        configuration.HostConfig.Binds.push(volume.binding);
      }
    });
  };

  return service;
}
