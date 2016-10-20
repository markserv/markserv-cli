// const fs = require('fs');

// const helpfs = require(__dirname + '/help.fs');

let Markconf;

let globalStack = {};

const configure = conf => {
  Markconf = conf;
};

const attachConfigurator = activeModule => {
  activeModule.configure = conf => {
    activeModule.Markconf = conf;
  };
};

const modulePkgMeta = pkg => {
  const meta = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description
  };

  return meta;
};

const activateModule = fullModPath => {
  const moduleCallback = require(fullModPath);
  const modulePkg = require(fullModPath + '/package.json');

  const activatedModule = {
    meta: modulePkgMeta(modulePkg),
    httpResponseModifier: moduleCallback
  };

  console.log(activatedModule);

  return activatedModule;
};

const loadNpmModule = modpath => {
  const fullModPath = Markconf.path + '/node_modules/' + modpath;
  const activeModule = activateModule(fullModPath);
  return activeModule;
};

const loadLocalModule = modpath => {
  const fullModPath = Markconf.path + '/' + modpath;
  const activeModule = activateModule(fullModPath);
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

          // Make the module configurable
          attachConfigurator(activeModule);
          activeModule.configure(Markconf);

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
