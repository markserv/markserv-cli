const path = require('path');
const fs = require('./help.fs');
const log = require('./core.logger');

const filterModulePkgMeta = pkg => {
  const meta = {
    name: pkg.name,
    template: pkg.template,
    version: pkg.version,
    description: pkg.description
  };

  if ({}.hasOwnProperty.call(pkg, 'author')) {
    meta.author = pkg.author;
  }

  return meta;
};

const getModulePkg = (ModifierModule, moduleDir) => {
  let modulePkg;

  try {
    moduleDir = moduleDir.split('/lib')[0];
    modulePkg = require(moduleDir + '/package.json');
  } catch (err) {
    modulePkg = {
      name: ModifierModule.exports.name
    };
  }

  return modulePkg;
};

const buildModulePkgMeta = (ModifierModule, moduleDir) => {
  const modulePkgData = getModulePkg(ModifierModule, moduleDir);
  const modulePkgMeta = filterModulePkgMeta(modulePkgData);
  return modulePkgMeta;
};

const compileTemplate = templatePath => {
  return new Promise((resolve, reject) => {
    fs.readfile(templatePath)
      .then(html => {
        resolve(html);
      })
      .catch(err => {
        reject(err);
      });
  });
};

// module.exports = (ModifierModule, initFunction, name) => {
module.exports = (name, modulePath, ModifierModule, initFunction, markserv) => { // eslint-disable-line max-params
  log.trace('Registering modifier: ' + modulePath);

  const moduleDir = path.dirname(ModifierModule.id);

  const meta = buildModulePkgMeta(ModifierModule, moduleDir);

  if (meta.name) {
    name = meta.name;
  } else if (name) {
    meta.name = name;
  }

  const metaTemplate = meta.template;
  const templatePath = '';
  let template = '';

  if (metaTemplate) {
    const templatePath = moduleDir.split('lib')[0] + meta.template;
    // Initialize a template during load (sync)
    template = fs.readfileSync(templatePath);
  }

  // Re-initializing a template after load (promises)
  const loadTemplate = () => {
    compileTemplate(templatePath)
    .then(htmlTemplate => {
      ModifierModule.exports.template = htmlTemplate;
    });
  };

  const templateOverride = '';

  const overrideTemplate = newTemplate => {
    console.log('OVERRIDEING TEMPLATE!!!!!!: ' + newTemplate);
    ModifierModule.exports.templateOverride = newTemplate;
  };

  const loadModifier = () => {};

  const exports = {
    name,
    meta,
    template,
    templateOverride,
    overrideTemplate,
    templatePath,
    loadTemplate,
    loadModifier
  };

  const httpResponseModifier = initFunction(exports, markserv);

  ModifierModule.exports = exports;
  ModifierModule.exports.httpResponseModifier = httpResponseModifier;
  ModifierModule.exports.configure = conf => {
    log.trace('Modifier ' + log.hl(meta.name) + ' received a new Markconf configuration.');
    ModifierModule.exports.Markconf = conf;
  };
  // ModifierModule.exports.overrideTemplate = overrideTemplate;

  return ModifierModule;
};
