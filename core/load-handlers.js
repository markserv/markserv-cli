// const fs = require('fs');

// const helpfs = require(__dirname + '/help.fs');

let Markconf;

let globalStack = {};

const configure = conf => {
  Markconf = conf;
};

const loadNpmModule = modpath => {
  const activeModule = require(Markconf.path + '/node_modules/' + modpath);
  return activeModule;
};

const loadLocalModule = modpath => {
  const fullpath = Markconf.path + '/' + modpath;
  const activeModule = require(fullpath);
  return activeModule;
};

const fetchModule = (name, deps) => {
  return new Promise((resolve, reject) => {
    let activeModule;

    if (typeof deps === 'string') {
      try {
        activeModule = loadNpmModule(deps);
      } catch (err) {
        try {
          activeModule = loadLocalModule(deps);
        } catch (err) {
        }
      }
    }

    if (!activeModule) {
      return reject('Err: Could not load: "' + deps + '"');
    }

    resolve(activeModule);
  });
};

const countMembers = obj => {
  let count = 0;
  for (const member in obj) {
    if ({}.hasOwnProperty.call(obj, member)) {
      count += 1;
    }
  }
  return count;
};

const clearStack = () => {
  globalStack = {};
};

const load = handlers => {
  return new Promise((resolve, reject) => {
    const handlerCount = countMembers(handlers);
    const loadStack = [];

    if (handlerCount <= 0) {
      return reject(['Err: No handlers provided']);
    }

    for (const name in handlers) {
      if ({}.hasOwnProperty.call(handlers, name)) {
        loadStack.push(fetchModule(name, handlers[name]));
      }
    }

    Promise.all(loadStack).then(loadedModules => {
      const returnStack = {};

      let i = 0;
      let activeModule;

      for (const moduleName in handlers) {
        if ({}.hasOwnProperty.call(handlers, moduleName)) {
          activeModule = loadedModules[i];
          i += 1;

          returnStack[moduleName] = activeModule;
          globalStack[moduleName] = activeModule;
        }
      }

      resolve(returnStack);
    })
    .catch(err => {
      // console.log(err);
      return reject(['Err: Handler could not be loaded'].concat(err));
    });
  });
};

module.exports = {
  configure,
  stack: globalStack,
  load,
  clearStack
};
