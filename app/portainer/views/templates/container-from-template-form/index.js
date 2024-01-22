import angular from 'angular';
import controller from './container-from-template-form.controller.js';

angular.module('portainer').component('containerFromTemplateForm', {
  templateUrl: './container-from-template-form.html',
  controller,
  bindings: {
    template: '<',
    allowBindMounts: '<',
    unselectTemplate: '<',
  },
});
