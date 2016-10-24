const path = require('path');

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

const getModulePkg = modulePath => {
  let modulePkg;

  try {
    modulePkg = require(modulePath + '/package.json');
  } catch (err) {
    const paths = modulePath.split('/');
    modulePkg = {
      name: paths[paths.length - 1]
    };
  }

  return modulePkg;
};

const buildModulePkgMeta = id => {
  const modulePath = path.dirname(id).split('/mod')[0];
  console.log(modulePath);
  const modulePkgData = getModulePkg(modulePath);
  const modulePkgMeta = filterModulePkgMeta(modulePkgData);
  return modulePkgMeta;
};

const compileTemplate = templatePath => {
  return 'ZZZZZZZZZ+' + templatePath;
};

module.exports = (ModifierModule, initFunction) => {
  let Markconf;

  console.log('-------------------------------');

  const configure = conf => {
    Markconf = conf;
  };

  const meta = buildModulePkgMeta(ModifierModule.id);

  const templatePath = meta.template;

  const loadTemplate = () => {
    return compileTemplate(templatePath);
  };

  const template = loadTemplate();

  const loadModifier = () => {};

  const httpResponseModifier = initFunction(Markconf, template);

  ModifierModule.exports = {
    configure,
    Markconf,
    meta,
    template,
    templatePath,
    loadTemplate,
    loadModifier,
    httpResponseModifier
  };

  // const loadTemplate = () => {};
};
