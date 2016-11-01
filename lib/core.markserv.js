// const path = require('path');
// const Promise = require('bluebird');

const log = require('./core.logger');
const help = require('./core.help');
const plugin = require('./core.plugin');

const httpRequestHandler = require('./http.request-handler');
const httpServer = require('./http.server');

// Friendly Ctrl + C Termination
require('./core.sigint')(process);

const configurePlugins = Markconf => {
  log.trace('A new Markconf configuratin was received.');
  if ({}.hasOwnProperty.call(Markconf, 'plugins') === false) {
    log.warn('No plugins were found to configure.');
    return;
  }

  if ({}.hasOwnProperty.call(Markconf.plugins, 'modifiers') === false) {
    log.warn('No ' + log.hl('modifier') + ' plugins were found to configure.');
    return;
  }

  if (Markconf.plugins.modifiers.core) {
    for (const pluginName in Markconf.plugins.modifiers.core) {
      if ({}.hasOwnProperty.call(Markconf.plugins.modifiers.core, pluginName)) {
        log.trace('Configuring core modifier plugin: ' + log.hl(pluginName));
        const plugin = Markconf.plugins.modifiers.core[pluginName];
        plugin.configure(Markconf);
      }
    }
  } else {
    log.warn('No ' + log.hl('core') + ' modifier plugins were found to configure.');
  }

  if (Markconf.plugins.modifiers.path) {
    for (const pluginName in Markconf.plugins.modifiers.path) {
      if ({}.hasOwnProperty.call(Markconf.plugins.modifiers.path, pluginName)) {
        log.trace('Configuring path modifier plugin: ' + log.hl(pluginName));
        const plugin = Markconf.plugins.modifiers.path[pluginName];
        plugin.configure(Markconf);
      }
    }
  } else {
    log.warn('No ' + log.hl('path') + ' modifier plugins were found to configure.');
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
