// const path = require('path');
const Promise = require('bluebird');

const log = require('./core.logger');
const help = require('./core.help');
const plugin = require('./core.plugin');

const loadIncluders = require('./plugin.load-includers');
const loadModifiers = require('./plugin.load-modifiers');
const httpRequestHandler = require('./http.request-handler');
const httpServer = require('./http.server');

// Friendly Ctrl + C Termination
require('./core.sigint')(process);

const markserv = () => {
  let Markconf;

  const loadedIncluders = {};
  const loadedCoreModifiers = {};
  const loadedPathModifiers = {};
  const activeMarkconf = {};

  const service = {
    help,

    Markconf,
    activeMarkconf,

    loadedIncluders,
    loadedCoreModifiers,
    loadedPathModifiers,

    configure: conf => {
      log.trace('Markserv received new configuration.');
      Markconf = conf;
      loadIncluders.configure(conf);
      loadModifiers.configure(conf);
      httpServer.configure(conf);
      httpRequestHandler.configure(conf);
      return service;
    },

    initialized: false,
    loadPlugins: () => {
      return new Promise((resolve, reject) => {
        log.trace('Initializing Markserv');
        log.trace('Loading plugins...');

        // Load Includes
        // const includers = loadIncluders.load(Markconf.includers);

        // Load Handlers/Modifiers
        const coreModifiers = loadModifiers.load(Markconf.modifiers.core, 'core');
        // const pathModifiers = loadModifiers.load(Markconf.modifiers.path, 'path');

        // Place all load operations on a promise stack
        const loadStack = [];
        // loadStack.push(includers, coreModifiers, pathModifiers);
        loadStack.push(coreModifiers);

        Promise.all(loadStack).then(loaded => {
          log.trace('Plugins loaded sccessfully.');

          // service.loadedIncluders = loaded[0];
          service.loadedCoreModifiers = loaded[1];
          service.loadedPathModifiers = loaded[2];

          const liveMarkconfModules = {
            // includes: loadedIncluders,
            modifiers: {
              core: loadedCoreModifiers,
              path: loadedPathModifiers
            }
          };

          // SuperMarconf combines: process args, Markconf settings & loaded mods
          // It can be re-initialized at any point
          service.activeMarkconf = Object.assign(Markconf, liveMarkconfModules);
          resolve(activeMarkconf);
        }).catch(err => {
          log.error('Could not load plugins.');
          log.error(err);
          reject(err);
        });
      });
    },

    startServer: activeMarkconf => {
      log.trace('Starting Markserv...');
      console.log(activeMarkconf);
      httpServer.configure(activeMarkconf);
      httpServer.start(httpRequestHandler);
      log.trace('Markserv started successfully.');
      return service;
    }
  };

  return service;
};

const spawnService = conf => {
  const Service = markserv();

  Service
    .configure(conf)
    .loadPlugins()
    .then(Service.startServer);

  return Service;
};

module.exports = {
  spawnService,
  help,
  plugin
};
