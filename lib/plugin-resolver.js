const path = require('path');
const cloneDeep = require('clone-deep');

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

// Keys not found in patten objects should not be spidered
const isKeyInObj = (key, obj) => {
  let result;

  try {
    result = obj[key];
  } catch (err) {
    return false;
  }

  if (typeof result === 'undefined') {
    return false;
  }

  return true;
};

const getNextPattern = (pattern, key) => {
  let nextPattern;

  try {
    nextPattern = pattern[key];
  } catch (err) {
    return false;
  }

  return nextPattern;
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

  const stringMember = props => {
    const conf = props.conf;
    const key = props.key;
    const member = props.member;
    const trace = props.trace;
    const moduleType = props.moduleType;
    const importDepth = props.importDepth;

    const moduleReference = key;
    const modulePackage = member;

    // console.log('mmmmmmmmmmmmmmmmmmmm');
    // console.log(modulePackage);

    const modifier = loadModifier(moduleReference, modulePackage, confDir, importDepth);

    if (modifier.module) {
      const activeModifier = plugin(moduleReference, modulePackage, modifier.module, modifier.path, moduleType);
      const validModifier = verify[moduleType](activeModifier.exports, moduleReference, importDepth);
      if (validModifier) {
        conf[key] = activeModifier.exports;
      } else {
        delete conf[key];
      }
    }

    if (modifier.conf) {
      // Deep-extract the part of the external Markconf containing the
      // modules that were defined in the local Markconf
      const extraction = deepExtract(trace, modifier.conf);
      // Replace node with the active loaded node module
      conf[key] = extraction[key];
    }
  };

  // Spider through Marcconf looking for strings containing module references
  const deepSpider = (conf, pattern, ancestorOfMatch, trace, moduleType) => {
    for (const key in conf) {
      if ({}.hasOwnProperty.call(conf, key)) {

        // console.log('____________________________________________________________');
        // console.log('conf:', conf);
        // console.log('key:', key);
        // console.log('pattern:', pattern);
        // console.log('typeof member:', typeof conf[key]);
        // console.log('ancestorOfMatch:', ancestorOfMatch);

        const keyInPattern = isKeyInObj(key, pattern);
        ancestorOfMatch = keyInPattern || ancestorOfMatch;

        if (keyInPattern === false && ancestorOfMatch === false) {
          delete conf[key];
          continue;
        }

        const member = conf[key];
        let memberType = typeof member;
        if (memberType === 'object' && Array.isArray(member)) {
          memberType = 'array';
        }

        if (memberType === 'object') {
          trace.push(key);
          const nextPattern = getNextPattern(pattern, key);
          const next = deepSpider(member, nextPattern, ancestorOfMatch, trace, moduleType);
          if (next) {
            conf[key] = next;
          } else {
            delete conf[key];
          }
        }

        if (memberType === 'string') {
          stringMember({conf, key, member, confDir, trace, moduleType, importDepth});
        }

        if (memberType === 'array') {
          for (const [index, item] of member.entries()) {
            console.log('[][][][][][][][][][][][][][][][][][][][][][][][][]');

            const itemType = typeof item;

            if (itemType === 'string') {
              stringMember({
                conf: member,
                key: index,
                member: item,
                confDir,
                trace,
                moduleType,
                importDepth
              });
            }

            if (itemType === 'object') {
              // console.log('1111111111111111111111');
              // console.log(item);
              for (const moduleReference in item) {
                if ({}.hasOwnProperty.call(item, moduleReference)) {
                  const templatePath = item[moduleReference];
                  const modulePackage = moduleReference;
                  const modifier = loadModifier(moduleReference, modulePackage, confDir, importDepth);
                  if (modifier.module) {
                    const activeModifier = plugin(moduleReference, modulePackage, modifier.module, modifier.path, moduleType);
                    const validModifier = verify[moduleType](activeModifier.exports, moduleReference, importDepth);

                    if (validModifier) {
                      conf[key][index] = activeModifier.exports;
                    } else {
                      delete conf[key][index];
                    }
                  } else if (modifier.conf) {
                    const extraction = deepExtract(trace, modifier.conf);
                    conf[key][index] = extraction[key];
                  }

                  if (moduleType === 'modifier') {
                    const realTemplatePath = path.join(modifier.confPath, templatePath);
                    conf[key][index].updateTemplate(realTemplatePath);
                  }
                }
              }
            }

          }
        }

      }
    }

    let count = 0;

    for (const i in conf) {
      if ({}.hasOwnProperty.call(conf, i)) {
        count += 1;
      }
    }

    if (count > 0) {
      return conf;
    }

    return false;
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

    // const conf = Object.assign({}, Markconf);
    const conf = cloneDeep(Markconf);

    const collection = deepSpider(conf, importPattern, ancestorOfMatch, trace, moduleType);

    return collection;
  };

  // Includers are required by modifiers, and so loaded before them
  const includers = collect('includers');
  const modifiers = collect('modifiers');
  const combinedConf = Object.assign({}, includers, modifiers);

  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log(combinedConf);
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

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
    const activeMarkconf = buildActiveMarkconf(Markconf, confFile, confDir, importDepth);
    return activeMarkconf;
  }

  log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!', importDepth);
  return error;
};

module.exports = resolveMarkconf;
