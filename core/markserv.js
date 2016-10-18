const path = require('path');

const Promise = require('bluebird');

const loadIncludes = require(path.join(__dirname, 'load-includes'));
const loadHandlers = require(path.join(__dirname, 'load-handlers'));
const httpServer = require(path.join(__dirname, 'http-server'));
const httpRequestHandler = require(path.join(__dirname, 'http-request-handler'));

let Markconf;

let loadedIncludes = {};
let loadedCoreHandlers = {};
let loadedPathHandlers = {};

const configure = conf => {
  console.log(conf);
  Markconf = conf;
  loadIncludes.configure(conf);
  loadHandlers.configure(conf);
  httpServer.configure(conf);
  httpRequestHandler.configure(conf);
};

const initialize = conf => {
  if (typeof conf === 'object') {
    configure(conf);
  }

  return new Promise((resolve, reject) => {
    const includes = loadIncludes.load(Markconf.includes);
    const coreHandlers = loadHandlers.load(Markconf.handlers.core);
    const pathHandlers = loadHandlers.load(Markconf.handlers.path);

    const loadStack = [];
    loadStack.push(includes, coreHandlers, pathHandlers);

    Promise.all(loadStack).then(loadedModules => {
      loadedIncludes = loadedModules[0];
      loadedCoreHandlers = loadedModules[1];
      loadedPathHandlers = loadedModules[2];

      const liveMarkconfModules = {
        includes: loadedIncludes,
        handlers: {
          core: loadedCoreHandlers,
          path: loadedPathHandlers
        }
      };

      // SuperMarconf combines: process args, Markconf settings & loaded mods
      // It can be re-initialized at any point
      const SuperMarkconf = Object.assign(Markconf, liveMarkconfModules);

      resolve(SuperMarkconf);
    }).catch(err => {
      console.error(err);
      reject(err);
    });
  });
};

const start = SuperMarkconf => {
  httpServer.configure(SuperMarkconf);
  httpServer.start(httpRequestHandler);
};

module.exports = {
  configure,
  initialize,
  start
};
