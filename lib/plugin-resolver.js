const path = require('path');
const log = require('./core.logger');
const fs = require('./help.fs');
// const register = require('./plugin.register-modifier.js');
const plugin = require('./core.plugin');

const loadModifier = (name, modifierModuleName, confDir, importDepth) => {
  const modPath = path.join(confDir, 'node_modules', modifierModuleName);
  const appFile = path.join(modPath, 'Markconf.js');
  // console.log(modPath, appFile);

  // 1) Try linking from external Markserv App definition
  if (fs.fileExistsSync(appFile)) {
    log.trace('Modifier ' + log.ul(name) + ' points to Markserv App: ' + log.ul(modPath) + '.', importDepth);

    return {
      conf: module.exports(modPath, importDepth),
      path: modPath
    };
  }

  let activeModule;
  const errors = [];

  // 2) Try straight-up node module 'require'
  try {
    activeModule = require(modifierModuleName);

    log.trace('Found modifier: ' + log.ul(name) + ' as NPM Module: ' + log.ul(modPath) + '.', importDepth);

    return {
      module: activeModule,
      path: require.resolve(modifierModuleName),
      confPath: confDir
    };
  } catch (err) {
    errors.push(err, '\n');
  }

  // 3) Try require node module that is a deep dependancy of another Markconf
  try {
    const deepPkgPath = path.join(modPath, 'package.json');
    const deepPkg = require(deepPkgPath);
    const deepModPath = path.join(modPath, deepPkg.main);
    activeModule = require(deepModPath);

    log.trace('Found modifier: ' + log.ul(name) + ' as NPM Module from deep dependancy: ' + log.ul(deepModPath) + '.', importDepth);

    return {
      module: activeModule,
      path: deepModPath,
      confPath: confDir
    };
  } catch (err) {
    errors.push(err, '\n');
  }

  // 4) Try local script
  try {
    const scriptPath = path.join(confDir, modifierModuleName);

    activeModule = require(scriptPath);

    log.trace('Found modifier: ' + log.ul(name) + ' as local script: ' + log.ul(scriptPath) + '.', importDepth);
    return {
      module: activeModule,
      path: scriptPath,
      confPath: confDir
    };
  } catch (err) {
    errors.push(err, '\n');
  }

  if (errors.length > 0) {
    log.error('Error loading modifiers: ' + errors);
    return false;
  }
};

const exception = (modifierName, should) => {
  const errorText = log.hl(modifierName) + ' ' + log.red(should);
  log.error(errorText);
  throw new Error(errorText);
};

const ownProp = (obj, ref) => {
  return {}.hasOwnProperty.call(obj, ref);
};

const verifyModifier = (activeModule, modifierName, importDepth) => {
  let score = 0;
  const requirements = 4;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if (typeof activeModule === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should be an object');
  }

  if (ownProp(activeModule, 'httpResponseModifier') &&
  typeof activeModule.httpResponseModifier === 'function') {
    score += 1;
  } else {
    exception(modifierName,
      'should have an httpResponseModifier callback function');
  }

  if (ownProp(activeModule, 'meta') && typeof activeModule.meta === 'object') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta object');
  }

  if (ownProp(activeModule.meta, 'name') &&
    typeof activeModule.meta.name === 'string') {
    score += 1;
  } else {
    exception(modifierName, 'should contain meta.name string');
  }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier verified: ' + log.hl(modifierName), importDepth);
  } else {
    const fails = score - requirements;
    log.error(log.red('MODIFIER NOT VERIFIED: ') + log.hl(modifierName) +
      log.red(' (' + fails + ' failures)'), importDepth);
  }

  return pass;
};

const verifyIncluder = (activeModule, includerName, importDepth) => {
  let score = 0;
  const requirements = 4;

  // When the module loader above could not load any modifier module
  if (!activeModule) {
    return false;
  }

  if (typeof activeModule === 'object') {
    score += 1;
  } else {
    exception(includerName, 'should be an object');
  }

  if (ownProp(activeModule, 'htmlCommentIncluder') &&
  typeof activeModule.htmlCommentIncluder === 'function') {
    score += 1;
  } else {
    exception(includerName,
      'should have an htmlCommentIncluder callback function');
  }

  if (ownProp(activeModule, 'meta') && typeof activeModule.meta === 'object') {
    score += 1;
  } else {
    exception(includerName, 'should contain meta object');
  }

  if (ownProp(activeModule.meta, 'name') &&
    typeof activeModule.meta.name === 'string') {
    score += 1;
  } else {
    exception(includerName, 'should contain meta.name string');
  }

  const pass = score === requirements;

  if (pass) {
    log.trace('Modifier verified: ' + log.hl(includerName), importDepth);
  } else {
    const fails = score - requirements;
    log.error(log.red('INCLUDER NOT VERIFIED: ') + log.hl(includerName) +
      log.red(' (' + fails + ' failures)'), importDepth);
  }

  return pass;
};

const verify = {
  includers: verifyIncluder,
  modifiers: verifyModifier
};

const generateImportPattern = type => {
  let pattern;

  if (type === 'includers') {
    pattern = {
      includers: {}
    };
  }

  if (type === 'modifiers') {
    pattern = {
      modifiers: {}
    };
  }

  return pattern;
};

// Resolve & require modifier modules for Markconf {core, path}
const buildActiveMarkconf = (Markconf, confFile, confDir, importDepth) => {
  // Extract a module from from deep inside an external  Markconf
  const deepExtract = (trace, conf) => {
    let extraction = conf;
    for (const elem of trace) {
      extraction = extraction[elem];
    }
    return extraction;
  };

  // Spider through Marcconf looking for strings containing module references
  const deepSpider = (conf, pattern, ancestorOfMatch, trace, moduleType) => {
    for (const reference in conf) { // eslint-disable-line guard-for-in
      // The current node of the object we are analyzing
      const confMember = conf[reference];
      let type = typeof confMember;

      // Set type to array where nessesary
      if (type === 'object' && Array.isArray(confMember)) {
        type = 'array';
      }

      // If our refernce is an object and matches the import pattern...
      if (type === 'object') {
        // Check if this node matches the allowable importPattern
        const match = {}.hasOwnProperty.call(pattern, reference);

        // Make sure the match of a parent always propagates downward
        ancestorOfMatch = match || ancestorOfMatch;

        // Remeber the path.to.this.node  of the object
        trace.push(reference);

        // Spider import pattern in parallel with the conf
        const nextPattern = pattern[reference];

        if (match) {
          // Spider one level deeper
          const next = deepSpider(confMember, nextPattern, ancestorOfMatch, trace, moduleType);

          // Replace the current conf node with the deeper spidered node
          conf[reference] = next;
        } else {
          delete conf[reference];
          continue;
        }

      // If we find a string within the allowable import pattern definition...
      } else if (type === 'string') {
        const moduleName = reference;
        const modulePackage = confMember;

        // Assume the string references a module and try to load it
        const modifier = loadModifier(moduleName, modulePackage, confDir,
          importDepth);

        // If the string was a module...
        if (modifier.module) {
          const activeModifier = plugin(moduleName, modulePackage, modifier.module, modifier.path, moduleType);

          // Check the module has no errors
          const validModifier = verify[moduleType](activeModifier.exports, moduleName, importDepth);

          if (validModifier) {
            // Replace it with the active loaded node module
            conf[reference] = activeModifier.exports;
          } else {
            conf[reference] = null;
          }

        // If the string was an external Markconf
        } else if (modifier.conf) {
          // Deep-extract the part of the external Markconf containing the
          // modules that were defined in the local Markconf
          const extraction = deepExtract(trace, modifier.conf);

          // Replace node with the active loaded node module
          conf[reference] = extraction[reference];
        }
      } else if (type === 'array') {
        for (const [index, elem] of confMember.entries()) {
          for (const moduleName in elem) {
            if ({}.hasOwnProperty.call(elem, moduleName)) {
              const templatePath = elem[moduleName];
              const modulePackage = moduleName;

              // Assume the string references a module and try to load it
              const modifier = loadModifier(moduleName, modulePackage, confDir, importDepth);

              // If the string was a module...
              if (modifier.module) {
                const activeModifier = plugin(moduleName, modulePackage, modifier.module, modifier.path, moduleType);

                // Check the module has no errors
                const validModifier = verify[moduleType](activeModifier.exports, moduleName, importDepth);

                if (validModifier) {
                  // Replace it with the active loaded node module
                  conf[reference][index] = activeModifier.exports;
                } else {
                  conf[reference][index] = null;
                }

              // If the string was an external Markconf
              } else if (modifier.conf) {
                // Deep-extract the part of the external Markconf containing the
                // modules that were defined in the local Markconf
                const extraction = deepExtract(trace, modifier.conf);

                // Replace node with the active loaded node module
                conf[reference][index] = extraction[reference];
              }

              if (moduleType === 'modifier') {
                const realTemplatePath = path.join(modifier.confPath, templatePath);
                conf[reference][index].updateTemplate(realTemplatePath);
              }
            }
          }
        }
      }
    }

    return conf;
  };

  const collect = moduleType => {
    // `importPattern` is an object tree that is used by the deepSpider to check
    // whether modules found within an external Markconf configuration file are
    // valid for import. (Not all parts of the Markconf are module definitions).
    const importPattern = generateImportPattern(moduleType);

    // `trace` is an array that stores the path to a deep member of the Markconf.
    // If that member is to be imported, it is used to pull the module deep from
    // the external Markconf, into the local Markconf.
    const trace = [];

    // `ancestorOfImportMatch` is a boolean flag that allowing the deepSpider to
    // know if the current member matches the importPattern. (Not all parts of the
    // Markconf are module definitions).
    const ancestorOfMatch = false;

    const conf = Object.assign({}, Markconf);

    const collection = deepSpider(conf, importPattern, ancestorOfMatch, trace, moduleType);

    return collection;
  };

  // Includers are required by modifiers, and so loaded before them
  const includers = collect('includers');
  const modifiers = collect('modifiers');
  const combinedConf = Object.assign({}, includers, modifiers);
  return combinedConf;
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
    return buildActiveMarkconf(Markconf, confFile, confDir, importDepth);
  }

  log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', importDepth);
  return error;
};

module.exports = resolveMarkconf;
