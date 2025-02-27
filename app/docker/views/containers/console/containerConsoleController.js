import { Terminal } from 'xterm';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { commandStringToArray } from '@/docker/helpers/containers';

angular.module('portainer.docker').controller('ContainerConsoleController', [
  '$scope',
  '$state',
  '$transition$',
  'ContainerService',
  'ImageService',
  'Notifications',
  'ContainerHelper',
  'ExecService',
  'HttpRequestHelper',
  'LocalStorage',
  'CONSOLE_COMMANDS_LABEL_PREFIX',
  'SidebarService',
  'endpoint',
  function (
    $scope,
    $state,
    $transition$,
    ContainerService,
    ImageService,
    Notifications,
    ContainerHelper,
    ExecService,
    HttpRequestHelper,
    LocalStorage,
    CONSOLE_COMMANDS_LABEL_PREFIX,
    SidebarService,
    endpoint
  ) {
    var socket, term;

    let states = Object.freeze({
      disconnected: 0,
      connecting: 1,
      connected: 2,
    });

    $scope.loaded = false;
    $scope.states = states;
    $scope.state = states.disconnected;

    $scope.formValues = {};
    $scope.containerCommands = [];

    // Ensure the socket is closed before leaving the view
    $scope.$on('$destroy', function () {
      $scope.disconnect();
    });

    $scope.connectAttach = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;

      let attachId = $transition$.params().id;

      ContainerService.container(endpoint.Id, attachId)
        .then((details) => {
          if (!details.State.Running) {
            Notifications.error('Failure', details, 'Container ' + attachId + ' is not running!');
            $scope.disconnect();
            return;
          }

          const params = {
            endpointId: $state.params.endpointId,
            id: attachId,
          };

          const base = window.location.origin.startsWith('http') ? `${window.location.origin}${baseHref()}` : baseHref();
          var url =
            base +
            'api/websocket/attach?' +
            Object.keys(params)
              .map((k) => k + '=' + params[k])
              .join('&');

          initTerm(url, ContainerService.resizeTTY.bind(this, endpoint.Id, attachId));
        })
        .catch(function error(err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
          $scope.disconnect();
        });
    };

    $scope.connectExec = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;
      var command = $scope.formValues.isCustomCommand ? $scope.formValues.customCommand : $scope.formValues.command;
      var execConfig = {
        id: $transition$.params().id,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        User: $scope.formValues.user,
        Cmd: commandStringToArray(command),
      };

      ContainerService.createExec(endpoint.Id, execConfig)
        .then(function success(data) {
          const params = {
            endpointId: $state.params.endpointId,
            id: data.Id,
          };

          const base = window.location.origin.startsWith('http') ? `${window.location.origin}${baseHref()}` : baseHref();
          var url =
            base +
            'api/websocket/exec?' +
            Object.keys(params)
              .map((k) => k + '=' + params[k])
              .join('&');

          const isLinuxCommand = execConfig.Cmd ? isLinuxTerminalCommand(execConfig.Cmd[0]) : false;
          initTerm(url, ExecService.resizeTTY.bind(this, params.id), isLinuxCommand);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to exec into container');
          $scope.disconnect();
        });
    };

    $scope.disconnect = function () {
      if (socket) {
        socket.close();
      }
      if ($scope.state > states.disconnected) {
        $scope.state = states.disconnected;
        if (term) {
          term.write('\n\r(connection closed)');
          term.dispose();
        }
      }
    };

    $scope.autoconnectAttachView = function () {
      return $scope.initView().then(function success() {
        if ($scope.container.State.Running) {
          $scope.connectAttach();
        }
      });
    };

    function resize(restcall, add) {
      if ($scope.state != states.connected) {
        return;
      }

      add = add || 0;

      term.fit();
      var termWidth = term.cols;
      var termHeight = 30;
      term.resize(termWidth, termHeight);

      restcall(termWidth + add, termHeight + add, 1);
    }

    function isLinuxTerminalCommand(command) {
      const validShellCommands = ['ash', 'bash', 'dash', 'sh'];
      return validShellCommands.includes(command);
    }

    function initTerm(url, resizeRestCall, isLinuxTerm = false) {
      let resizefun = resize.bind(this, resizeRestCall);

      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }

      if (url.indexOf('https') > -1) {
        url = url.replace('https://', 'wss://');
      } else {
        url = url.replace('http://', 'ws://');
      }

      socket = new WebSocket(url);

      socket.onopen = function () {
        let closeTerminal = false;
        let commandBuffer = '';

        $scope.state = states.connected;
        term = new Terminal();

        if (isLinuxTerm) {
          // linux terminals support xterm
          socket.send('export LANG=C.UTF-8\n');
          socket.send('export LC_ALL=C.UTF-8\n');
          socket.send('export TERM="xterm-256color"\n');
          socket.send('alias ls="ls --color=auto"\n');
          socket.send('echo -e "\\033[2J\\033[H"\n');
        }

        term.onData(function (data) {
          socket.send(data);

          // This code is detect whether the user has
          // typed CTRL+D or exit in the terminal
          if (data === '\x04') {
            // If the user types CTRL+D, close the terminal
            closeTerminal = true;
          } else if (data === '\r') {
            if (commandBuffer.trim() === 'exit') {
              closeTerminal = true;
            }
            commandBuffer = '';
          } else {
            commandBuffer += data;
          }
        });

        var terminal_container = document.getElementById('terminal-container');
        term.open(terminal_container);
        term.focus();
        term.setOption('cursorBlink', true);

        window.onresize = function () {
          resizefun();
          $scope.$apply();
        };

        $scope.$watch(SidebarService.isSidebarOpen, function () {
          setTimeout(resizefun, 400);
        });

        socket.onmessage = function (e) {
          term.write(e.data);
        };

        socket.onerror = function (err) {
          if (closeTerminal) {
            $scope.disconnect();
          } else {
            Notifications.error('Failure', err, 'Connection error');
          }
          $scope.$apply();
        };

        socket.onclose = function () {
          if (closeTerminal) {
            $scope.disconnect();
          }
          $scope.$apply();
        };

        resizefun(1);
        $scope.$apply();
      };
    }

    $scope.initView = function () {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      return ContainerService.container(endpoint.Id, $transition$.params().id)
        .then(function success(data) {
          var container = data;
          $scope.container = container;
          return ImageService.image(container.Image);
        })
        .then(function success(data) {
          var image = data;
          var containerLabels = $scope.container.Config.Labels;
          $scope.imageOS = image.Os;
          $scope.formValues.command = image.Os === 'windows' ? 'powershell' : 'bash';
          $scope.containerCommands = Object.keys(containerLabels)
            .filter(function (label) {
              return label.indexOf(CONSOLE_COMMANDS_LABEL_PREFIX) === 0;
            })
            .map(function (label) {
              return {
                title: label.replace(CONSOLE_COMMANDS_LABEL_PREFIX, ''),
                command: containerLabels[label],
              };
            });
          $scope.loaded = true;
        })
        .catch(function error(err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
        });
    };

    $scope.handleIsCustomCommandChange = function (enabled) {
      $scope.$evalAsync(() => {
        $scope.formValues.isCustomCommand = enabled;
      });
    };
  },
]);
