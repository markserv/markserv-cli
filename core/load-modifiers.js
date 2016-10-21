let Markconf;

let globalStack = {};

const configure = conf => {
  Markconf = conf;
};

const loadModule = fullModPath => {
  const loadedModule = require(fullModPath);
  return loadedModule;
};

const loadNpmModule = modpath => {
  const fullModPath = Markconf.path + '/node_modules/' + modpath;
  const activeModule = loadModule(fullModPath);
  return activeModule;
};

const loadLocalModule = modpath => {
  const fullModPath = Markconf.path + '/' + modpath;
  const activeModule = loadModule(fullModPath);
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

const load = modifiers => {
  return new Promise((resolve, reject) => {
    const handlerCount = countMembers(modifiers);
    const loadStack = [];

    if (handlerCount <= 0) {
      return reject(['Err: No modifiers provided']);
    }

    for (const name in modifiers) {
      if ({}.hasOwnProperty.call(modifiers, name)) {
        loadStack.push(fetchModule(name, modifiers[name]));
      }
    }

    Promise.all(loadStack).then(loadedModules => {
      const returnStack = {};

      let i = 0;
      let activeModule;

      for (const moduleName in modifiers) {
        if ({}.hasOwnProperty.call(modifiers, moduleName)) {
          activeModule = loadedModules[i];
          i += 1;

          if (activeModule.configure) {
            activeModule.configure(Markconf);
          } else {
            // throw a warning
          }

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
