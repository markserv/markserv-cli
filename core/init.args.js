const path = require('path');
const pkg = require('../package.json');
const log = require('./core.logger');

const cwd = process.cwd();
const configFilepath = path.join(cwd, pkg.settings.configFilename);
const defaultsFilepath = path.join(cwd, pkg.settings.defaultsFilename);

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
    dir: parsed.dir || cwd,
    conf: parsed.conf || configFilepath,
    port: parsed.port,
    address: parsed.address,
    loglevel: parsed.loglevel,
    defaults: path.resolve(parsed.defaults)
  };

  return filteredArgs;
};

const parseDefaultOptions = (file, args) => {
  const defaults = require(file);
  const program = setup(defaults.options);
  const parsed = program.parse(args || process.args);
  return parsed;
};

const parse = args => {
  let parsed = parseDefaultOptions(defaultsFilepath, args);

  // If CLI user overrides Markconf.Defaults.js file
  if (path.resolve(parsed.defaults) !== path.resolve(defaultsFilepath)) {
    // Reload and re-parse the defaults
    parsed = parseDefaultOptions(defaultsFilepath, args);
  }

  const filteredArgs = filter(parsed);
  log.setLevel(filteredArgs.loglevel);

  return filteredArgs;
};

module.exports = {
  parse
};
