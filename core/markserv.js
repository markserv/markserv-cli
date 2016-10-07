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

const initialize = () => {
  return new Promise((resolve, reject) => {
    const includes = loadIncludes.load(Markconf.includes);
    const coreHandlers = loadHandlers.load(Markconf.handlers.core);

    const loadStack = [];
    loadStack.push(includes, coreHandlers);

    Promise.all(loadStack).then(loadedModules => {
      loadedIncludes = loadedModules[0];
      loadedHandlers = loadedModules[1];

      console.log(loadedIncludes);
    }).catch(err => {
      console.error(err);
      reject(err);
    });

  });
};

const start = () => {
};

module.exports = {
  configure,
  initialize,
  start,
};
