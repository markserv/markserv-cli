const Command = require('commander').Command;

const program = new Command(process.argv);
const pkg = require('../package.json');

const configFilename = pkg.settings.configFilename;
const defaultsFilename = pkg.settings.defaultsFilename;
const cwd = process.cwd();

program
  .version('0.0.1')
  .option('-d, --dir', 'Directory to serve from.', './')
  .option('-p, --port [type]', 'Port to serve on [port]', 8080)
  .option('-a, --address [type]', 'IP sddress to serve on [address]', 'localhost')
  .option('-c, --conf [type]', 'Markconf.js file to use.')
  .option('-l, --loglevel [type]', 'TRACE, DEBUG, INFO, WARN, ERROR, FATAL [loglevel]', 'WARN');

const filter = parsed => {
  const filteredArgs = {
    dir: parsed.dir || cwd,
    conf: parsed.conf || cwd + '/' + configFilename,
    port: parsed.port,
    address: parsed.address,
    loglevel: parsed.loglevel,
    defaults: cwd + '/' + defaultsFilename
  };

  return filteredArgs;
};

const parse = args => {
  const parsed = program.parse(args || process.argv);
  const filteredArgs = filter(parsed);
  return filteredArgs;
};

module.exports = {
  parse
};
