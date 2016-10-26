const path = require('path');
const fs = require('./help.fs');
const log = require('./core.logger');

const filterModulePkgMeta = pkg => {
  const meta = {
    name: pkg.name,
    template: pkg.template,
    version: pkg.version,
    description: pkg.description,
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

module.exports = (ModifierModule, initFunction, name) => {
  log.trace('Registering modifier: ' + ModifierModule.id);

  let Markconf;

  const configure = conf => {
    Markconf = conf;
  };

  let moduleDir = path.dirname(ModifierModule.id);

  const meta = buildModulePkgMeta(ModifierModule, moduleDir);

  if (meta.name) {
    name = meta.name;
  } else if (name) {
    meta.name = name;
  }

  const templatePath = moduleDir.split('lib')[0] + meta.template;

  const template = '';

  const loadTemplate = () => {
    compileTemplate(templatePath)
    .then(htmlTemplate => {
      ModifierModule.exports.template = htmlTemplate;
    });
  };

  loadTemplate();

  const loadModifier = () => {};

  const exports = {
    name,
    configure,
    Markconf,
    meta,
    template,
    templatePath,
    loadTemplate,
    loadModifier
  };

  const httpResponseModifier = initFunction(exports);
  ModifierModule.exports = exports;
  ModifierModule.exports.httpResponseModifier = httpResponseModifier;

  return ModifierModule;
};
