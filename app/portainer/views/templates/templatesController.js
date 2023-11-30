import _ from 'lodash-es';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { AccessControlFormData } from '../../components/accessControlForm/porAccessControlFormModel';

angular.module('portainer.app').controller('TemplatesController', [
  '$scope',
  '$q',
  '$state',
  'TemplateService',
  'Notifications',
  'ResourceControlService',
  'Authentication',
  'FormValidator',
  'StackService',
  '$async',
  function ($scope, $q, $state, TemplateService, Notifications, ResourceControlService, Authentication, FormValidator, StackService, $async) {
    const DOCKER_STANDALONE = 'DOCKER_STANDALONE';
    const DOCKER_SWARM_MODE = 'DOCKER_SWARM_MODE';

    $scope.state = {
      selectedTemplate: null,
      showAdvancedOptions: false,
      formValidationError: '',
      actionInProgress: false,
    };

    $scope.formValues = {
      network: '',
      name: '',
      AccessControlData: new AccessControlFormData(),
    };

    function validateForm(accessControlData, isAdmin) {
      $scope.state.formValidationError = '';
      var error = '';
      error = FormValidator.validateAccessControl(accessControlData, isAdmin);

      if (error) {
        $scope.state.formValidationError = error;
        return false;
      }
      return true;
    }

    function createComposeStackFromTemplate(template, userId, accessControlData) {
      var stackName = $scope.formValues.name;

      for (var i = 0; i < template.Env.length; i++) {
        var envvar = template.Env[i];
        if (envvar.preset) {
          envvar.value = envvar.default;
        }
      }

      var repositoryOptions = {
        RepositoryURL: template.Repository.url,
        ComposeFilePathInRepository: template.Repository.stackfile,
        FromAppTemplate: true,
      };

      const endpointId = +$state.params.endpointId;
      StackService.createComposeStackFromGitRepository(stackName, repositoryOptions, template.Env, endpointId)
        .then(function success(data) {
          const resourceControl = data.ResourceControl;
          return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
        })
        .then(function success() {
          Notifications.success('Success', 'Stack successfully deployed');
          $state.go('docker.stacks');
        })
        .catch(function error(err) {
          Notifications.error('Deployment error', err);
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function createStackFromTemplate(template, userId, accessControlData) {
      var stackName = $scope.formValues.name;
      var env = _.filter(
        _.map(template.Env, function transformEnvVar(envvar) {
          return {
            name: envvar.name,
            value: envvar.preset || !envvar.value ? envvar.default : envvar.value,
          };
        }),
        function removeUndefinedVars(envvar) {
          return envvar.value && envvar.name;
        }
      );

      var repositoryOptions = {
        RepositoryURL: template.Repository.url,
        ComposeFilePathInRepository: template.Repository.stackfile,
        FromAppTemplate: true,
      };

      const endpointId = +$state.params.endpointId;

      StackService.createSwarmStackFromGitRepository(stackName, repositoryOptions, env, endpointId)
        .then(function success(data) {
          const resourceControl = data.ResourceControl;
          return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
        })
        .then(function success() {
          Notifications.success('Success', 'Stack successfully deployed');
          $state.go('docker.stacks');
        })
        .catch(function error(err) {
          Notifications.error('Deployment error', err);
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    $scope.createTemplate = function () {
      var userDetails = Authentication.getUserDetails();
      var userId = userDetails.ID;
      var accessControlData = $scope.formValues.AccessControlData;

      if (!validateForm(accessControlData, $scope.isAdmin)) {
        return;
      }

      var template = $scope.state.selectedTemplate;

      $scope.state.actionInProgress = true;
      if (template.Type === 2) {
        createStackFromTemplate(template, userId, accessControlData);
      } else if (template.Type === 3) {
        createComposeStackFromTemplate(template, userId, accessControlData);
      }
    };

    $scope.unselectTemplate = function () {
      return $async(async () => {
        $scope.state.selectedTemplate = null;
      });
    };

    $scope.selectTemplate = function (template) {
      return $async(async () => {
        if ($scope.state.selectedTemplate) {
          await $scope.unselectTemplate();
        }

        if (template.Network) {
          $scope.formValues.network = _.find($scope.availableNetworks, function (o) {
            return o.Name === template.Network;
          });
        } else {
          $scope.formValues.network = _.find($scope.availableNetworks, function (o) {
            return o.Name === 'bridge';
          });
        }

        $scope.formValues.name = template.Name ? template.Name : '';
        $scope.state.selectedTemplate = template;
        $scope.state.deployable = isDeployable($scope.applicationState.endpoint, template.Type);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    };

    function isDeployable(endpoint, templateType) {
      let deployable = false;
      switch (templateType) {
        case 1:
          deployable = endpoint.mode.provider === DOCKER_SWARM_MODE || endpoint.mode.provider === DOCKER_STANDALONE;
          break;
        case 2:
          deployable = endpoint.mode.provider === DOCKER_SWARM_MODE;
          break;
        case 3:
          deployable = endpoint.mode.provider === DOCKER_SWARM_MODE || endpoint.mode.provider === DOCKER_STANDALONE;
          break;
      }
      return deployable;
    }

    function initView() {
      $scope.isAdmin = Authentication.isAdmin();

      const endpointId = +$state.params.endpointId;

      const endpointMode = $scope.applicationState.endpoint.mode;
      const apiVersion = $scope.applicationState.endpoint.apiVersion;
      const showSwarmStacks = endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER' && apiVersion >= 1.25;

      $scope.disabledTypes = !showSwarmStacks ? [TemplateType.SwarmStack] : [];

      $q.all({
        templates: TemplateService.templates(endpointId),
      })
        .then(function success(data) {
          var templates = data.templates;
          $scope.templates = templates;
        })
        .catch(function error(err) {
          $scope.templates = [];
          Notifications.error('Failure', err, 'An error occurred during apps initialization.');
        });
    }

    initView();
  },
]);
