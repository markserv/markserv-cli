const path = require('path');
const Promise = require('bluebird');

const log = require('./core.logger');

const loadIncluders = require(path.join(__dirname, 'plugin.load-includers'));
const loadModifiers = require(path.join(__dirname, 'plugin.load-modifiers'));
// const loadTemplates = require(path.join(__dirname, 'load-templates'));
const httpServer = require(path.join(__dirname, 'http.server'));
const httpRequestHandler = require(path.join(__dirname, 'http.request-handler'));

let Markconf;

let loadedIncluders = {};
let loadedCoreModifiers = {};
let loadedPathModifiers = {};

const configure = conf => {
  log.trace('Markserv received new configuration.');
  Markconf = conf;
  loadIncluders.configure(conf);
  loadModifiers.configure(conf);
  httpServer.configure(conf);
  httpRequestHandler.configure(conf);
};

const initialize = conf => {
  log.trace('Initializing Markserv');

  if (typeof conf === 'object') {
    configure(conf);
  }

  return new Promise((resolve, reject) => {
    log.trace('Loading plugins...');

    // Load Includes
    const includers = loadIncluders.load(Markconf.includers);

    // Load Handlers/Modifiers
    const coreModifiers = loadModifiers.load(Markconf.modifiers.core);
    const pathModifiers = loadModifiers.load(Markconf.modifiers.path);

    // Load Templates
    // const allHandlerModules = Object.assign(coreHandlers, pathHandlers);
    // const allTemplates = loadTemplates.load(allHandlerModules);

    // Place all load operations on a promise stack
    const loadStack = [];
    // loadStack.push(includes, coreHandlers, pathHandlers, allTemplates);
    loadStack.push(includers, coreModifiers, pathModifiers);

    Promise.all(loadStack).then(loaded => {
      log.trace('Plugins loaded sccessfully.');

      loadedIncluders = loaded[0];
      loadedCoreModifiers = loaded[1];
      loadedPathModifiers = loaded[2];
      // loadedTemplates = loaded[3];

      const liveMarkconfModules = {
        includes: loadedIncluders,
        modifiers: {
          core: loadedCoreModifiers,
          path: loadedPathModifiers
        }
      };

      // SuperMarconf combines: process args, Markconf settings & loaded mods
      // It can be re-initialized at any point
      const SuperMarkconf = Object.assign(Markconf, liveMarkconfModules);

      resolve(SuperMarkconf);
    }).catch(err => {
      log.error('Could not load plugins.');
      log.error(err);
      reject(err);
    });
  });
};

const start = SuperMarkconf => {
  log.trace('Starting Markserv...');
  httpServer.configure(SuperMarkconf);
  httpServer.start(httpRequestHandler);
  log.trace('Markserv started successfully.');
};

module.exports = {
  configure,
  initialize,
  start
};
