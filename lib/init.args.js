const path = require('path');

const pkg = require('app/package.json');
const log = require('app/core.logger');
const helpFs = require('app/help.fs');

const cwd = process.cwd();

const configFilepath = path.join(cwd, pkg.settings.configFilename);

const localDefaultsFilepath = path.join(cwd, pkg.settings.defaultsFilename);
const defaultsFileFound = helpFs.fileExistsSync(localDefaultsFilepath);
let defaults;

if (defaultsFileFound) {
  defaults = require(localDefaultsFilepath);
} else {
  const appDefaultsFilepath = path.join('app', pkg.settings.defaultsFilename);
  defaults = require(appDefaultsFilepath);
}

const setup = options => {
  const Command = require('commander').Command;
  const program = new Command(process.argv);
  program.version(pkg.version);

  for (const name in options) {
    if ({}.hasOwnProperty.call(options, name)) {
      const option = options[name];
      const flag = option.flag + ' --' + name + ' [type]';
      program.option(flag, option.help, option.value);
    }
  }

  return program;
};

// Only these args will fall through to the Markconf object
const filter = parsed => {
  const filteredArgs = {
    root: parsed.root || cwd,
    conf: parsed.conf || configFilepath,
    port: parsed.port,
    address: parsed.address,
    loglevel: parsed.loglevel,
    defaults: path.resolve(parsed.defaults)
  };

  return filteredArgs;
};

const parseDefaultOptions = (defaults, args) => {
  const program = setup(defaults.options);
  const parsed = program.parse(args || process.args);
  return parsed;
};

const parse = args => {
  let parsed = parseDefaultOptions(defaults, args);

  console.log(parsed);

  // [ THIS NEEDS TESTING, THINKING ABOUT, MAY NOT BE A GREAT IDEA ]
  // If CLI user overrides Markconf.Defaults.js file
  // if (path.resolve(parsed.defaults) !== path.resolve(defaultsFilepath)) {
  //   // Reload and re-parse the defaults
  //   parsed = parseDefaultOptions(defaultsFilepath, args);
  // }

  const filteredArgs = filter(parsed);
  log.setLevel(filteredArgs.loglevel);

  return filteredArgs;
};

module.exports = {
  parse
};
