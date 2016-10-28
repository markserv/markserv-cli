const path = require('path');
const fs = require('./help.fs');
const log = require('./core.logger');

let Markconf;

let globalStack = {};

const configure = conf => {
  Markconf = conf;
};

const checkIsMarkservApp = modpath => {
  return new Promise((resolve, reject) => {
    const fullModPath = Markconf.path + '/node_modules/' + modpath;
    const childMarkconf = fullModPath + '/Markconf.js';

    fs.fileExists(childMarkconf)
    .then(exists => {
      if (!exists) {
        return resolve(false);
      }

      if (exists) {
        const markservAppConf = require(childMarkconf);

        const app = {
          Markconf: markservAppConf,
          path: fullModPath
        };

        resolve(app);
      }
    }).catch(err => {
      reject(err);
    });
  });
};

const loadNpmModule = modpath => {
  const fullModPath = Markconf.path + '/node_modules/' + modpath;
  const activeModule = require(fullModPath);
  return activeModule;
};

// const loadLocalModule = modpath => {
//   const fullModPath = Markconf.path + '/' + modpath;
//   const activeModule = loadModule(fullModPath);
//   return activeModule;
// };

const inheritAppModule = (mofiName, mofiClass, msApp) => {
  console.log('""""""""""""""""""""""""""""""""""""""""""""');

  if (msApp &&
    msApp.Markconf &&
    msApp.Markconf.modifiers &&
    msApp.Markconf.modifiers[mofiClass] &&
    msApp.Markconf.modifiers[mofiClass][mofiName]) {
    const mofiDep = msApp.Markconf.modifiers[mofiClass][mofiName];
    const depNodeModulePath = path.join(msApp.path, mofiDep);
    console.log(depPath);
    // return fetchModule();
  }
};

const fetchModule = (name, deps, type) => {
  console.warn(name);
  return new Promise((resolve, reject) => {
    let activeModule;

    const errors = [];

    // Is it a Markserv app reference?
    // Is it an installed node_module?
    // Is it a javascript file (local module)?

    if (typeof deps === 'string') {
      try {
        checkIsMarkservApp(deps)
        .then(app => {
          if (app) {
            activeModule = inheritAppModule(name, type, app);
          } else {
            activeModule = loadNpmModule(deps);
          }
        });
      } catch (err) {
        reject(err);
      }
    }

    if (!activeModule) {
      errors.unshift('Err: Could not load: "' + deps + '"');
      return reject(errors);
    }

    console.log(activeModule);

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

const load = (modifiers, type) => {
  return new Promise((resolve, reject) => {
    const modifierCount = countMembers(modifiers);
    const loadStack = [];

    if (modifierCount <= 0) {
      // No modifiers provided
      resolve(null);
    }

    for (const name in modifiers) {
      if ({}.hasOwnProperty.call(modifiers, name)) {
        loadStack.push(fetchModule(name, modifiers[name], type));
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
          // console.log(moduleName, activeModule);
        }
      }

      resolve(returnStack);
    })
    .catch(err => {
      err.unshift('Err: Modifier could not be loaded');
      return reject(err);
    });
  });
};

module.exports = {
  configure,
  stack: globalStack,
  load,
  clearStack
};
