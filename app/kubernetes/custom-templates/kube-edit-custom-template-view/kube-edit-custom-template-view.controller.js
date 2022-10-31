import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { AccessControlFormData } from '@/portainer/components/accessControlForm/porAccessControlFormModel';
import { isBE } from '@/portainer/feature-flags/feature-flags.service';
import { getFilePreview } from '@/react/portainer/gitops/gitops.service';
import { getTemplateVariables, intersectVariables } from '@/react/portainer/custom-templates/components/utils';

class KubeEditCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService, UserService) {
    Object.assign(this, { $async, $state, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService, UserService });

    this.isTemplateVariablesEnabled = isBE;

    this.formValues = {
      Variables: [],
    };
    this.state = {
      formValidationError: '',
      isEditorDirty: false,
      isTemplateValid: true,
      isEditorReadOnly: false,
      templateLoadFailed: false,
      templatePreviewFailed: false,
      templatePreviewError: '',
    };
    this.templates = [];

    this.getTemplate = this.getTemplate.bind(this);
    this.submitAction = this.submitAction.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onBeforeUnload = this.onBeforeUnload.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onVariablesChange = this.onVariablesChange.bind(this);
    this.previewFileFromGitRepository = this.previewFileFromGitRepository.bind(this);
  }

  getTemplate() {
    return this.$async(async () => {
      try {
        const { id } = this.$state.params;

        const template = await this.CustomTemplateService.customTemplate(id);

        if (template.GitConfig !== null) {
          try {
            this.formValues.FileContent = await this.CustomTemplateService.fetchFileFromGitRepository(id);

            this.state.isEditorReadOnly = true;
          } catch (err) {
            this.state.templateLoadFailed = true;
          }
        } else {
          template.FileContent = await this.CustomTemplateService.customTemplateFile(id);
        }

        template.Variables = template.Variables || [];

        this.formValues = { ...this.formValues, ...template };

        this.parseTemplate(template.FileContent);
        this.parseGitConfig(template.GitConfig);

        this.oldFileContent = this.formValues.FileContent;

        this.formValues.ResourceControl = new ResourceControlViewModel(template.ResourceControl);
        this.formValues.AccessControlData = new AccessControlFormData();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve custom template data');
      }
    });
  }

  onVariablesChange(values) {
    this.handleChange({ Variables: values });
  }

  handleChange(values) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...values,
      };
    });
  }

  parseTemplate(templateStr) {
    if (!this.isTemplateVariablesEnabled) {
      return;
    }

    const variables = getTemplateVariables(templateStr);

    const isValid = !!variables;

    this.state.isTemplateValid = isValid;

    if (isValid) {
      this.onVariablesChange(intersectVariables(this.formValues.Variables, variables));
    }
  }

  parseGitConfig(GitConfig) {
    if (GitConfig === null) {
      return;
    }

    let flatConfig = {
      RepositoryURL: GitConfig.URL,
      RepositoryReferenceName: GitConfig.ReferenceName,
      ComposeFilePathInRepository: GitConfig.ConfigFilePath,
      RepositoryAuthentication: GitConfig.Authentication !== null,
    };

    if (GitConfig.Authentication) {
      flatConfig = {
        ...flatConfig,
        RepositoryUsername: GitConfig.Authentication.Username,
        RepositoryPassword: GitConfig.Authentication.Password,
      };
    }

    this.formValues = { ...this.formValues, ...flatConfig };
  }

  previewFileFromGitRepository() {
    this.state.templatePreviewFailed = false;
    this.state.templatePreviewError = '';

    let creds = {};
    if (this.formValues.RepositoryAuthentication) {
      creds = {
        username: this.formValues.RepositoryUsername,
        password: this.formValues.RepositoryPassword,
      };
    }
    const payload = {
      repository: this.formValues.RepositoryURL,
      targetFile: this.formValues.ComposeFilePathInRepository,
      ...creds,
    };

    this.$async(async () => {
      try {
        this.formValues.FileContent = await getFilePreview(payload);
        this.state.isEditorDirty = true;
      } catch (err) {
        this.state.templatePreviewError = err.message;
        this.state.templatePreviewFailed = true;
      }
    });
  }

  validateForm() {
    this.state.formValidationError = '';

    if (!this.formValues.FileContent) {
      this.state.formValidationError = 'Template file content must not be empty';
      return false;
    }

    const title = this.formValues.Title;
    const id = this.$state.params.id;

    const isNotUnique = this.templates.some((template) => template.Title === title && template.Id != id);
    if (isNotUnique) {
      this.state.formValidationError = `A template with the name ${title} already exists`;
      return false;
    }

    const isAdmin = this.Authentication.isAdmin();
    const accessControlData = this.formValues.AccessControlData;
    const error = this.FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      this.state.formValidationError = error;
      return false;
    }

    return true;
  }

  submitAction() {
    return this.$async(async () => {
      if (!this.validateForm()) {
        return;
      }

      this.actionInProgress = true;
      try {
        await this.CustomTemplateService.updateCustomTemplate(this.formValues.Id, this.formValues);

        const userDetails = this.Authentication.getUserDetails();
        const userId = userDetails.ID;
        await this.ResourceControlService.applyResourceControl(userId, this.formValues.AccessControlData, this.formValues.ResourceControl);

        this.Notifications.success('Success', 'Custom template successfully updated');
        this.state.isEditorDirty = false;
        this.$state.go('kubernetes.templates.custom');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update custom template');
      } finally {
        this.actionInProgress = false;
      }
    });
  }

  onChangeFileContent(value) {
    if (stripSpaces(this.formValues.FileContent) !== stripSpaces(value)) {
      this.formValues.FileContent = value;
      this.parseTemplate(value);
      this.state.isEditorDirty = true;
    }
  }

  async $onInit() {
    this.$async(async () => {
      this.getTemplate();

      try {
        this.templates = await this.CustomTemplateService.customTemplates();
      } catch (err) {
        this.Notifications.error('Failure loading', err, 'Failed loading custom templates');
      }

      window.addEventListener('beforeunload', this.onBeforeUnload);
    });
  }

  isEditorDirty() {
    return this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty;
  }

  uiCanExit() {
    if (this.isEditorDirty()) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }

  onBeforeUnload(event) {
    if (this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty) {
      event.preventDefault();
      event.returnValue = '';

      return '';
    }
  }

  $onDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }
}

export default KubeEditCustomTemplateViewController;

function stripSpaces(str = '') {
  return str.replace(/(\r\n|\n|\r)/gm, '');
}
