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
        plugin.configure(Markconf);
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
    return false;
  }

  if ({}.hasOwnProperty.call(Markconf.plugins, 'modifiers') === false) {
    log.error('No ' + log.hl('modifier') + ' plugins were found to configure.');
    return false;
  }

  const modifiers = Markconf.plugins.modifiers;

  if (modifiers) {
    configureStack(modifiers, Markconf);
    return true;
  }

  log.fatal('No ' + log.hl('core') + ' modifier plugins were found to configure.');
  return false;
};

const markserv = () => {
  let Markconf;

  const activeMarkconf = {};

  const service = {
    Markconf,
    activeMarkconf,

    isInitialized: false,

    // Plugin helpers are attached here
    help,

    configure: conf => {
      log.trace('Markserv received new configuration.');
      Markconf = conf;

      const hasPlugins = configurePlugins(Markconf);

      if (hasPlugins) {
        service.isInitialized = true;
      } else {
        service.Initialized = false;
      }

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
    },

    kill: () => {
      // httpServer.kill();
      // httpRequestHandler.kill();
      return service;
    }
  };

  return service;
};

const killService = service => {
  service.kill();
  return module.exports;
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
  killService,
  plugin
};
