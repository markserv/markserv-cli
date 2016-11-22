const path = require('path');
// const cloneDeep = require('clone-deep');

const log = require('./core.logger');
const fs = require('./help.fs');
const plugin = require('./core.plugin');
// const verify = require('./plugin-verifier');

// const registry = [];

const loadModule = (confName, moduleName, dir, importDepth) => {
  const errors = [];

  const localModPath = path.join(dir, 'node_modules', moduleName);
  const localAppFile = path.join(localModPath, 'Markconf.js');

  // 1) Try Marconf link to external Markserv App definition in local `node_modules`
  if (fs.fileExistsSync(localAppFile)) {
    log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(localModPath) + '.', importDepth);

    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log(localModPath);
    console.log(localAppFile);

    const nextMarkconf = module.exports(localModPath, importDepth);

    return {
      conf: nextMarkconf,
      path: localModPath
    };
  }

  // 2) Try Marconf link to Markserv App definition \w `require`
  const resolvedAppFile = require.resolve(moduleName);
  const resolvedAppDir = path.dirname(resolvedAppFile);
  let resolvedPkg;

  try {
    resolvedPkg = require(path.join(resolvedAppDir, '../package.json'));
  } catch (err) {
  }

  if (resolvedPkg === undefined) {
    log.trace('Modifier ' + log.ul(confName) + ' points to Markserv App: ' + log.ul(resolvedAppFile) + '.', importDepth);

    console.log('-------------------------------------------------------');
    console.log(resolvedAppDir);
    console.log(resolvedAppFile);

    const nextMarkconf = module.exports(resolvedAppDir, importDepth);

    return {
      conf: nextMarkconf,
      path: resolvedAppDir
    };
  }

  let activeModule;

  // 3) Try module include with 'require'
  try {
    activeModule = require(moduleName);

    log.trace('Found modifier: ' + log.ul(confName) + ' as NPM Module: ' + log.ul(localModPath) + '.', importDepth);

    return {
      activeModule,
      path: require.resolve(moduleName),
      confPath: dir
    };
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

    return {
      activeModule,
      path: deepModPath,
      confPath: dir
    };
  } catch (err) {
    errors.push(err, '\n');
  }

  // 5) Try module include as local script
  try {
    const scriptPath = path.join(dir, moduleName);
    activeModule = require(scriptPath);

    log.trace('Found modifier: ' + log.ul(confName) + ' as local script: ' + log.ul(scriptPath) + '.', importDepth);
    return {
      activeModule,
      path: scriptPath,
      confPath: dir
    };
  } catch (err) {
    errors.push(err, '\n');
  }

  if (errors.length > 0) {
    log.error('Error loading modifiers: ' + errors);
    return false;
  }
};

const prepareIncluder = (name, item, dir, depth) => {
  const loaded = loadModule(name, item, dir, depth);

  if ({}.hasOwnProperty.call(loaded, 'activeModule')) {
    const activePlugin = plugin(name, loaded.path, 'includer');
    return activePlugin.exports;
  }
};

const loadIncluders = (includers, dir, depth) => {
  let stack = {};

  if (typeof includers === 'string') {
    const subconf = loadModule('subconf', includers, dir, depth);

    if ({}.hasOwnProperty.call(subconf, 'conf') &&
        {}.hasOwnProperty.call(subconf.conf, 'includers')) {
      const subIncluders = subconf.conf.includers;

      if (subIncluders) {
        stack = subIncluders;
      }
    }
  }

  if (typeof includers === 'object') {
    Reflect.ownKeys(includers).forEach(name => {
      const item = includers[name];

      let itemType = typeof item;

      if (typeof itemType === 'object' && Array.isArray(item)) {
        itemType = 'array';
      }

      if (itemType === 'string') {
        const includer = prepareIncluder(name, item, dir, depth);
        stack[name] = includer;
      }
    });
  }

  return stack;
};

const prepareModifier = (name, item, dir, depth) => {
  const loaded = loadModule(name, item, dir, depth);

  if ({}.hasOwnProperty.call(loaded, 'activeModule')) {
    const activePlugin = plugin(name, loaded.path, 'modifier');
    return activePlugin.exports;
  }

  if ({}.hasOwnProperty.call(loaded, 'conf')) {
    const activePlugin = loaded.conf.modifiers[name];
    return activePlugin;
  }

  return null;
};

const prepareModifierArray = (name, modifierAry, dir, depth) => {
  const stack = [];

  for (const [index, item] of modifierAry.entries()) {
    const itemType = typeof item;

    if (itemType === 'string') {
      const modifier = prepareModifier(name, item, dir, depth);
      if (modifier) {
        stack.push(modifier);
      }
    }

    if (itemType === 'object') {
      const moduleName = Object.keys(item)[0];
      const modifier = prepareModifier(index, moduleName, dir, depth);
      const templateUrl = item[moduleName];

      if (templateUrl) {
        const templatePath = path.join(dir, templateUrl);
        modifier.updateTemplate(templatePath);
      }

      if (modifier) {
        stack.push(modifier);
      }
    }
  }

  return stack;
};

const loadModifiers = (modifiers, dir, depth) => {
  let stack = {};

  if (typeof modifiers === 'string') {
    const subconf = loadModule('subconf', modifiers, dir, depth);

    if ({}.hasOwnProperty.call(subconf, 'conf') &&
        {}.hasOwnProperty.call(subconf.conf, 'modifiers')) {
      const subModifiers = subconf.conf.modifiers;

      if (subModifiers) {
        stack = subModifiers;
      }
    }
  }

  if (typeof modifiers === 'object') {
    Reflect.ownKeys(modifiers).forEach(name => {
      const item = modifiers[name];

      let itemType = typeof item;

      if (Array.isArray(item)) {
        itemType = 'array';
      }

      if (itemType === 'string') {
        const modifier = prepareModifier(name, item, dir, depth);
        if (modifier) {
          stack[name] = modifier;
        }
      }

      if (itemType === 'array') {
        const items = item;
        const modifierArray = prepareModifierArray(name, items, dir, depth);
        if (modifierArray.length > 0) {
          stack[name] = modifierArray;
        }
      }
    });
  }

  return stack;
};

// Resolve & require modifier modules for Markconf {core, path}
const buildActiveMarkconf = (Markconf, confFile, dir, importDepth) => {
  const plugins = {};

  if ({}.hasOwnProperty.call(Markconf, 'includers')) {
    const includers = loadIncluders(Markconf.includers, dir, importDepth);
    plugins.includers = includers;
  }

  if ({}.hasOwnProperty.call(Markconf, 'modifiers')) {
    const modifiers = loadModifiers(Markconf.modifiers, dir, importDepth);
    plugins.modifiers = modifiers;
  }

  return plugins;
};

const resolveMarkconf = (providedPath, importDepth) => {
  // Depth count used for debugging
  if (importDepth === undefined) {
    importDepth = 0;
  } else {
    importDepth += 1;
  }

  providedPath = providedPath.split('Markconf.js')[0];

  const confDir = path.resolve(providedPath);
  console.log('/////////////////////////////////////////////');
  const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
  console.log(confDir);
  console.log(confFile);
  console.log(providedPath);
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
    const activeMarkconf = buildActiveMarkconf(Markconf, confFile, confDir, importDepth);
    return activeMarkconf;
  }

  log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', importDepth);
  return error;
};

module.exports = resolveMarkconf;
