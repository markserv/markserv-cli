// const path = require('path');
// const Promise = require('bluebird');

const log = require('./core.logger');
const help = require('./core.help');
const plugin = require('./core.plugin');

const httpRequestHandler = require('./http.request-handler');
const httpServer = require('./http.server');

// Friendly Ctrl + C Termination
require('./core.sigint')(process);

const configureStack = (stack, Markconf) => {
  for (const pluginName in stack) {
    if ({}.hasOwnProperty.call(stack, pluginName)) {
      log.trace('Configuring core modifier plugin: ' + log.hl(pluginName));

      const plugin = stack[pluginName];
      const definitionType = Array.isArray(plugin) ? 'array' : 'object';

      if (definitionType === 'object') {
        console.log(pluginName);
        plugin.configure(Markconf);
        console.log('.............ok');
      } else if (definitionType === 'array') {
        for (const subPlug of plugin) {
          subPlug.configure(Markconf);
        }
      }
    }
  }
};

const configurePlugins = Markconf => {
  log.trace('A new Markconf configuration was received.');
  if ({}.hasOwnProperty.call(Markconf, 'plugins') === false) {
    log.warn('No plugins were found to configure.');
    return;
  }

  if ({}.hasOwnProperty.call(Markconf.plugins, 'modifiers') === false) {
    log.error('No ' + log.hl('modifier') + ' plugins were found to configure.');
    return;
  }

  const modifiers = Markconf.plugins.modifiers;

  if (modifiers) {
    configureStack(modifiers, Markconf);
  } else {
    log.fatal('No ' + log.hl('core') + ' modifier plugins were found to configure.');
  }
};

const markserv = () => {
  let Markconf;

  const activeMarkconf = {};

  const service = {
    help,

    Markconf,
    activeMarkconf,

    configure: conf => {
      log.trace('Markserv received new configuration.');
      Markconf = conf;
      configurePlugins(Markconf);
      httpServer.configure(conf);
      httpRequestHandler.configure(conf);
      help.configure(Markconf);
      return service;
    },

    startServer: activeMarkconf => {
      log.trace('Starting Markserv...');
      httpServer.configure(activeMarkconf);
      httpServer.start(httpRequestHandler);
      log.trace('Markserv http server started successfully.');
      return service;
    }
  };

  return service;
};

const spawnService = conf => {
  const Service = markserv();

  Service
    .configure(conf)
    .startServer(conf);

  return Service;
};

module.exports = {
  spawnService,
  plugin
};
