const path = require('path');
// const cloneDeep = require('clone-deep');

const Promise = require('bluebird');

const log = require('./core.logger');
const fs = require('./help.fs');
const plugin = require('./core.plugin');
// const verify = require('./plugin-verifier');

const loadModule = (confName, moduleName, dir, importDepth) => {
  return new Promise((resolve, reject) => {
    const errors = [];

    const localModPath = path.join(dir, 'node_modules', moduleName);
    const localAppFile = path.join(localModPath, 'Markconf.js');

    // 1) Try Marconf link to external Markserv App definition in local `node_modules`
    if (fs.fileExistsSync(localAppFile)) {
      log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(localModPath) + '.', importDepth);

      // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
      // console.log(localModPath);
      // console.log(localAppFile);

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
      resolvedPkg = require(path.join(resolvedAppDir, '../package.json'));
    } catch (err) {
    }

    if (resolvedPkg === undefined && resolvedAppFile !== false) {
      log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(resolvedAppFile) + '.', importDepth);

      // console.log('-------------------------------------------------------');
      // console.log(resolvedAppDir);
      // console.log(resolvedAppFile);

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

// const prepareIncluder = (name, item, dir, depth) => {
//   const loaded = loadModule(name, item, dir, depth);

//   if ({}.hasOwnProperty.call(loaded, 'activeModule')) {
//     const activePlugin = plugin(name, loaded.path, 'includer');
//     return activePlugin.exports;
//   }
// };

// const loadIncluders = (includers, dir, depth) => {
//   let stack = {};

//   if (typeof includers === 'string') {
//     const subconf = loadModule('subconf', includers, dir, depth);

//     if ({}.hasOwnProperty.call(subconf, 'conf') &&
//         {}.hasOwnProperty.call(subconf.conf, 'includers')) {
//       const subIncluders = subconf.conf.includers;

//       if (subIncluders) {
//         stack = subIncluders;
//       }
//     }
//   }

//   if (typeof includers === 'object') {
//     Reflect.ownKeys(includers).forEach(name => {
//       const item = includers[name];

//       let itemType = typeof item;

//       if (typeof itemType === 'object' && Array.isArray(item)) {
//         itemType = 'array';
//       }

//       if (itemType === 'string') {
//         const includer = prepareIncluder(name, item, dir, depth);
//         stack[name] = includer;
//       }
//     });
//   }

//   return stack;
// };

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
            // console.log(':::::::::::::::::::::::::::::::::::::::::');
            // console.log(modifierArrayStack);
            return loaded;
          }
        }));
      }

      if (itemType === 'object') {
        const moduleName = Object.keys(item)[0];

        promiseStack.push(prepareModifier(index, moduleName, dir, depth)
          .then(modifier => {
            return new Promise((resolve, reject) => {
              const templateUrl = item[moduleName];

              if (templateUrl) {
                const templatePath = path.join(dir, templateUrl);
                modifier.updateTemplate(templatePath).then(() => {
                  const loaded = {modifier, name};
                  resolve(loaded);
                }).catch(err => {
                  reject(err);
                });
              } else {
                const loaded = {modifier, name: moduleName};
                resolve(loaded);
              }
            });
          })
          .catch(err => {
            return reject(err);
          })
        );
      }
    }

    Promise.all(promiseStack).then(result => {
      console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
      const modifierArrayStack = [];

      for (const item of result) {
        modifierArrayStack.push(item.modifier);
      }

      console.log(modifierArrayStack);
      resolve(modifierArrayStack);
    }).catch(err => {
      reject(err);
    });
  });
};

const loadModifiers = (modifiers, dir, depth) => {
  return new Promise((resolve, reject) => {
    // A string modifier links to an external Markconf
    if (typeof modifiers === 'string') {
      loadModule('subconf', modifiers, dir, depth).then(subconf => {
        if ({}.hasOwnProperty.call(subconf, 'conf') &&
            {}.hasOwnProperty.call(subconf.conf, 'modifiers')) {
          const subModifiers = subconf.conf.modifiers;

          if (subModifiers) {
            return resolve(subModifiers);
          }
        }
      }).catch(err => {
        return reject(err);
      });
      // return;
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
            // console.log(modifierArray);
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
        // console.log(results);
        // console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
        const modifierStack = {};

        for (const loaded of results) {
          // console.log(loaded);
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

    const promiseStack = [];

    // if ({}.hasOwnProperty.call(Markconf, 'includers')) {
    //   promiseStack.push(loadIncluders(Markconf.includers, dir, importDepth));
    // }

    if ({}.hasOwnProperty.call(Markconf, 'modifiers')) {
      promiseStack.push(loadModifiers(Markconf.modifiers, dir, importDepth));
    }

    Promise.all(promiseStack).then(result => {
      const plugins = {
        modifiers: result[0]
        // includers: result[1]
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
    // console.log('/////////////////////////////////////////////');
    // console.log(confDir);
    // console.log(confFile);
    // console.log(providedPath);

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

      // const props = [Markconf, confFile, confDir, importDepth];
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
