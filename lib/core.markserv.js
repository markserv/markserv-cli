// const path = require('path');
const Promise = require('bluebird');

const log = require('./core.logger');
const help = require('./core.help');
const plugin = require('./core.plugin');

const httpRequestHandler = require('./http.request-handler');
const httpServer = require('./http.server');

// Friendly Ctrl + C Termination
require('./core.sigint')(process);

const configureStack = (stack, Markconf) => {
  return new Promise((resolve, reject) => {
    const promiseStack = [];

    for (const pluginName in stack) {
      if ({}.hasOwnProperty.call(stack, pluginName)) {
        log.trace(`Configuring core modifier plugin: ${log.hl(pluginName)}`);

        const plugin = stack[pluginName];
        const definitionType = Array.isArray(plugin) ? 'array' : 'object';

        if (definitionType === 'object') {
          promiseStack.push(plugin.configure(Markconf));
        } else if (definitionType === 'array') {
          for (const subPlug of plugin) {
            promiseStack.push(subPlug.configure(Markconf));
          }
        }
      }
    }

    Promise.all(promiseStack).then(() => {
      resolve(stack);
    }).catch(err => {
      reject(err);
    });
  });
};

const configurePlugins = Markconf => {
  return new Promise((resolve, reject) => {
    log.trace('Markserv is configuring plugins....');

    if ({}.hasOwnProperty.call(Markconf, 'plugins') === false) {
      const warn = 'No plugins were found to configure.';
      log.warn(warn);
      return reject(warn);
    }

    if ({}.hasOwnProperty.call(Markconf.plugins, 'modifiers') === false) {
      const err = 'No ' + log.hl('modifier') + ' plugins were found to configure.';
      log.error(err);
      return reject(err);
    }

    const modifiers = Markconf.plugins.modifiers;

    if (modifiers) {
      configureStack(modifiers, Markconf);
      return resolve(modifiers);
    }

    const fatal = 'No ' + log.hl('core') + ' modifier plugins were found to configure.';
    log.fatal(fatal);
    return reject(fatal);
  });
};

const markserv = () => {
  const activeMarkconf = {};

  const service = {
    Markconf: undefined,
    httpServer: undefined,

    activeMarkconf,
    isInitialized: false,

    // Plugin helpers are attached here
    help,

    configure: conf => {
      return new Promise((resolve, reject) => {
        console.log(service);

        log.trace('Markserv service received new configuration.');
        service.Markconf = conf;

        configurePlugins(service.Markconf).then(() => {
          log.trace('Markserv finished configuring plugins.');
          service.isInitialized = true;

          httpServer.configure(service.Markconf);
          httpRequestHandler.configure(service.Markconf);
          help.configure(service.Markconf);

          resolve(service);
        })
        .catch(err => {
          reject(err);
        });
      });
    },

    startServer: activeMarkconf => {
      log.trace('Starting Markserv...');
      httpServer.configure(activeMarkconf);
      httpServer.start(httpRequestHandler);
      service.httpServer = httpServer.server;
      log.trace('Markserv http server started successfully.');
      return service;
    },

    kill: () => {
      httpServer.kill();
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
  return new Promise((resolve, reject) => {
    const service = markserv();

    service
    .configure(conf).then(() => {
      service.startServer(conf);
      resolve(service);
    })
    .catch(err => {
      return reject(err);
    });
  });
};

module.exports = {
  spawnService,
  killService,
  plugin
};
