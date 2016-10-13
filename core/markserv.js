const Promise = require('Bluebird');
const loadIncludes = require(__dirname + '/loadIncludes');
const loadHandlers = require(__dirname + '/loadHandlers');

let Markconf;

let loadedIncludes = {};
let loadedHandlers = {};

const configure = conf => {
  Markconf = conf;
  loadIncludes.configure(conf);
  loadHandlers.configure(conf);
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

      const liveMarkconf = {
        includes: loadedIncludes,
        handlers: {
          core: loadedCoreHandlers,
          path: loadedPathHandlers,
        }
      };

      resolve(liveMarkconf);
    }).catch(err => {
      console.error(err);
      reject(err);
    });

  });
};

const start = liveConf => {
  console.log(liveConf);
};

module.exports = {
  configure,
  initialize,
  start,
};
