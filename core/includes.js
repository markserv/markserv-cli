const fs = require('fs');
const helpfs = require(__dirname + '/help.fs');
// const Markconf = require(__dirname + '/markconf');

let Markconf;
let stack = {};

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

const load = (name, deps) => {
  return new Promise((resolve, reject) => {
    let activeModule;

    if (typeof deps === 'string') {
      try {
        activeModule = loadNpmModule(deps);
      }
      catch (err) {
        try {
          activeModule = loadLocalModule(deps);
        }
        catch (err) {
        }
      }
    }

    if (!activeModule) {
      return reject('Err: Could not load: "' + deps + '"');
    }

    resolve(activeModule);
  });
};

const countMembers = (obj) => {
  let count = 0;
  for (member in obj) {
    count += 1;
  }
  return count;
};

const clearStack = () => {
  stack = {};
};

const add = includes => {
  return new Promise((resolve, reject) => {
    const includeCount = countMembers(includes);
    const loadStack = [];

    if (includeCount <= 0) {
      return reject(['Err: No includes provided']);
    }

    for (let name in includes) {
      loadStack.push(load(name, includes[name]));
    }

    Promise.all(loadStack).then(loadedModules => {
      const includeStack = {};

      let i = 0;
      for (let moduleName in includes) {
        includeStack[moduleName] = loadedModules[i];
        i += 1;
      };

      // console.log(includeStack);

      resolve(includeStack);
    })
    .catch(err => {
      // console.log(err);
      return reject(['Err: Include could not be loaded'].concat(err));
    });
  });
};

const initialize = conf => {
  Markconf = conf;
};

module.exports = {
  configure,
  add,
  stack,
};

