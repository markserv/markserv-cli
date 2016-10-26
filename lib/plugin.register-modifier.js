const path = require('path');
// const fs = require('./help.fs');
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

const getModulePkg = ModifierModule => {
  let modulePkg;
  let moduleDir = path.dirname(ModifierModule.id);

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

const buildModulePkgMeta = ModifierModule => {
  const modulePkgData = getModulePkg(ModifierModule);
  const modulePkgMeta = filterModulePkgMeta(modulePkgData);
  return modulePkgMeta;
};

const compileTemplate = templatePath => {
  // fs.readFile(templatePath);
  return 'ZZZZZZZZZ+' + templatePath;
};

module.exports = (ModifierModule, initFunction, name) => {
  log.trace('Registering modifier: ' + ModifierModule.id);

  let Markconf;

  const configure = conf => {
    Markconf = conf;
  };

  const meta = buildModulePkgMeta(ModifierModule);

  if (meta.name) {
    name = meta.name;
  } else if (name) {
    meta.name = name;
  }

  const templatePath = meta.template;

  const loadTemplate = () => {
    return compileTemplate(templatePath);
  };

  const template = loadTemplate();

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
