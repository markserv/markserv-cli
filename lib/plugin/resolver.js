const path = require('path');

const Promise = require('bluebird');

const log = require('app/lib/core/log');
const fs = require('app/lib/help/fs');
const plugin = require('app/lib/plugin/register');
// const verify = require('app/plugin/verifier');

const loadModule = (confName, moduleName, dir, importDepth) => {
  return new Promise((resolve, reject) => {
    const errors = [];

    const localModPath = path.join(dir, 'node_modules', moduleName);
    const localAppFile = path.join(localModPath, 'Markconf.js');

    // 1) Try Marconf link to external Markserv App definition in local `node_modules`
    if (fs.fileExistsSync(localAppFile)) {
      log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(localModPath) + '.', importDepth);

      module.exports(localModPath, importDepth).then(nextMarkconf => {
        const loaded = {
          conf: nextMarkconf,
          path: localModPath
        };

        resolve(loaded);
      }).catch(err => {
        errors.push(err);
      });

      return;
    }

    // 2) Try Marconf link to Markserv App definition \w `require`
    let resolvedAppFile;
    let resolvedAppDir;
    let resolvedPkg;

    try {
      resolvedAppFile = require.resolve(moduleName);
      resolvedAppDir = path.dirname(resolvedAppFile);
    } catch (err) {
      log.debug(`Could not resolve module ${log.ul(moduleName)}`);
      resolvedAppFile = false;
    }

    try {
      const resolvedPkgDir = path.join(resolvedAppDir, '..', 'package.json');
      resolvedPkg = require(resolvedPkgDir);
    } catch (err) {
      log.debug(err);
    }

    // WARNING: this is a bad idea, I need to rethink this as a markserv
    // project may exist within a parent dir that contains a package.json
    if (resolvedPkg === undefined && resolvedAppFile !== false) {
      log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(resolvedAppFile) + '.', importDepth);

      module.exports(resolvedAppDir, importDepth).then(nextMarkconf => {
        const loaded = {
          conf: nextMarkconf,
          path: resolvedAppDir
        };

        resolve(loaded);
      }).catch(err => {
        errors.push(err);
      });

      return;
    }

    let activeModule;

    // 3) Try module include with 'require'
    try {
      activeModule = require(moduleName);

      log.trace('Found modifier: ' + log.ul(confName) + ' as NPM Module: ' + log.ul(localModPath) + '.', importDepth);

      const loaded = {
        activeModule,
        path: require.resolve(moduleName),
        confPath: dir
      };

      return resolve(loaded);
    } catch (err) {
      errors.push(err, '\n');
    }

    // 4) Try module include as a deep dependancy of another Markconf
    try {
      const deepPkgPath = path.join(localModPath, 'package.json');
      const deepPkg = require(deepPkgPath);
      const deepModPath = path.join(localModPath, deepPkg.main);
      activeModule = require(deepModPath);

      log.trace('Found modifier: ' + log.ul(confName) + ' as NPM Module from deep dependancy: ' + log.ul(deepModPath) + '.', importDepth);

      const loaded = {
        activeModule,
        path: deepModPath,
        confPath: dir
      };

      return resolve(loaded);
    } catch (err) {
      errors.push(err, '\n');
    }

    // 5) Try module include as local script
    try {
      const scriptPath = path.join(dir, moduleName);
      activeModule = require(scriptPath);

      log.trace('Found modifier: ' + log.ul(confName) + ' as local script: ' + log.ul(scriptPath) + '.', importDepth);

      const loaded = {
        activeModule,
        path: scriptPath,
        confPath: dir
      };

      return resolve(loaded);
    } catch (err) {
      errors.push(err, '\n');
    }

    if (errors.length > 0) {
      log.error('Error loading modifiers: ' + errors);
      reject(false);
    }
  });
};

const prepareIncluder = (name, item, dir, depth) => {
  return new Promise((resolve, reject) => {
    loadModule(name, item, dir, depth).then(loaded => {
      if ({}.hasOwnProperty.call(loaded, 'activeModule')) {
        const activePlugin = plugin(name, loaded.path, 'includer');
        return resolve(activePlugin.exports);
      }

      if ({}.hasOwnProperty.call(loaded, 'conf')) {
        const activePlugin = loaded.conf.includers[name];
        return resolve(activePlugin);
      }

      reject(null);
    }).catch(err => {
      reject(err);
    });
  });
};

const loadIncluders = (includers, dir, depth) => {
  return new Promise((resolve, reject) => {
    if (includers === false) {
      return resolve({});
    }

    if (typeof includers === 'string') {
      loadModule('subconf', includers, dir, depth).then(subconf => {
        if ({}.hasOwnProperty.call(subconf, 'conf') &&
            {}.hasOwnProperty.call(subconf.conf, 'includers')) {
          const subIncluders = subconf.conf.includers;

          if (subIncluders) { // need if?
            // stack = subIncluders;
            resolve(subIncluders);
          }
        }
      }).catch(err => {
        return err;
      });
    }

    if (typeof includers === 'object') {
      const promiseStack = [];

      Reflect.ownKeys(includers).forEach(name => {
        const item = includers[name];

        let itemType = typeof item;

        if (typeof itemType === 'object' && Array.isArray(item)) {
          itemType = 'array';
        }

        if (itemType === 'string') {
          promiseStack.push(prepareIncluder(name, item, dir, depth)
          .then(includer => {
            const loaded = {includer, name};
            return loaded;
          }));
        }
      });

      Promise.all(promiseStack).then(results => {
        const stack = {};

        for (const item of results) {
          stack[item.name] = item.includer;
        }

        resolve(stack);
      }).catch(err => {
        reject(err);
      });
    }
  });
};

const prepareModifier = (name, item, dir, depth) => {
  return new Promise((resolve, reject) => {
    loadModule(name, item, dir, depth).then(loaded => {
      if ({}.hasOwnProperty.call(loaded, 'activeModule')) {
        const activePlugin = plugin(name, loaded.path, 'modifier');
        return resolve(activePlugin.exports);
      }

      if ({}.hasOwnProperty.call(loaded, 'conf')) {
        const activePlugin = loaded.conf.modifiers[name];
        return resolve(activePlugin);
      }

      reject(null);
    }).catch(err => {
      reject(err);
    });
  });
};

const prepareModifierArray = (name, modifierAry, dir, depth) => {
  return new Promise((resolve, reject) => {
    const promiseStack = [];

    for (const [index, item] of modifierAry.entries()) {
      const itemType = typeof item;

      if (itemType === 'string') {
        promiseStack.push(prepareModifier(name, item, dir, depth).then(modifier => {
          if (modifier) {
            const loaded = {modifier, name};
            return loaded;
          }
        }));
      }

      if (itemType === 'object') {
        const moduleName = Object.keys(item)[0];

        promiseStack.push(prepareModifier(index, moduleName, dir, depth)
          .then(modifier => {
            const templateUrl = item[moduleName];

            if (templateUrl) {
              const templatePath = path.join(dir, templateUrl);
              modifier.markconfTemplatePath = templatePath;
            }
            const loaded = {modifier, name};
            return loaded;
          })
        );
      }
    }

    Promise.all(promiseStack).then(result => {
      const modifierArrayStack = [];

      for (const item of result) {
        modifierArrayStack.push(item.modifier);
      }

      resolve(modifierArrayStack);
    }).catch(err => {
      reject(err);
    });
  });
};

const loadModifiers = (modifiers, dir, depth) => {
  return new Promise((resolve, reject) => {
    if (modifiers === false) {
      return resolve({});
    }

    // A string modifier links to an external Markconf
    if (typeof modifiers === 'string') {
      loadModule('subconf', modifiers, dir, depth).then(subconf => {
        if ({}.hasOwnProperty.call(subconf, 'conf') &&
            {}.hasOwnProperty.call(subconf.conf, 'modifiers')) {
          const subModifiers = subconf.conf.modifiers;

          if (subModifiers) {
            return resolve(subModifiers); // can remove return from here?
          }
        }
      }).catch(err => {
        return reject(err); // can remove return from here?
      });
    }

    // An object defines subcomponents install as individual packages
    if (typeof modifiers === 'object') {
      const promiseStack = [];

      Reflect.ownKeys(modifiers).forEach(name => {
        const item = modifiers[name];

        let itemType = typeof item;

        if (Array.isArray(item)) {
          itemType = 'array';
        }

        if (itemType === 'string') {
          promiseStack.push(prepareModifier(name, item, dir, depth)
            .then(modifier => {
              // can probably remove this if once converted all to promises?
              if (modifier) {
                // modifierStack[name] = modifier;
                // return modifierStack;
                return {modifier, name};
              }
            })
            .catch(err => {
              return reject(err);
            })
          );
        }

        if (itemType === 'array') {
          const items = item;
          promiseStack.push(prepareModifierArray(name, items, dir, depth)
          .then(modifierArray => {
            // can probably remove this if once converted all to promises?
            if (modifierArray.length > 0) {
              // modifierStack[name] = modifierArray;
              // return modifierStack;
              return {modifier: modifierArray, name};
            }
          }));
        }
      });

      Promise.all(promiseStack).then(results => {
        const modifierStack = {};

        for (const loaded of results) {
          modifierStack[loaded.name] = loaded.modifier;
        }

        resolve(modifierStack);
      }).catch(err => {
        reject(err);
      });
    }
  });
};

// Resolve & require modifier modules for Markconf {core, path}
const buildActiveMarkconf = props => {
  return new Promise((resolve, reject) => {
    const [Markconf, dir, importDepth] = props;

    const hasIncluders = {}.hasOwnProperty.call(Markconf, 'includers');
    const hasModifiers = {}.hasOwnProperty.call(Markconf, 'modifiers');

    const includers = hasIncluders ? Markconf.includers : false;
    const modifiers = hasModifiers ? Markconf.modifiers : false;

    const promiseStack = [];

    promiseStack.push(loadIncluders(includers, dir, importDepth));
    promiseStack.push(loadModifiers(modifiers, dir, importDepth));

    Promise.all(promiseStack).then(result => {
      const plugins = {
        includers: result[0],
        modifiers: result[1]
      };
      resolve(plugins);
    }).catch(err => {
      reject(err);
    });
  });
};

const resolveMarkconf = (providedPath, importDepth) => {
  return new Promise((resolve, reject) => {
    // Depth count used for debugging
    if (importDepth === undefined) {
      importDepth = 0;
    } else {
      importDepth += 1;
    }

    providedPath = providedPath.split('Markconf.js')[0];

    const confDir = path.resolve(providedPath);
    const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
    log.trace('Resolving Markconf for path: ' + log.ul(confFile), importDepth, '');

    let Markconf;
    let error;

    try {
      Markconf = require(confFile);
    } catch (err) {
      error = err;
      Markconf = false;
    }

    if (Markconf) {
      log.trace('Markconf ' + log.ul(confFile) + ' loaded successfully.', importDepth);
      log.trace(Markconf);

      const props = [Markconf, confDir, importDepth];

      buildActiveMarkconf(props).then(activeMarkconf => {
        resolve(activeMarkconf);
      }).catch(err => {
        reject(err);
      });

      return;
    }

    log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', importDepth);
    return error;
  });
};

module.exports = resolveMarkconf;