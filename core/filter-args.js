const program = require('commander');
const pkg = require('../package.json');

const configFilename = pkg.settings.configFilename;
const cwd = process.cwd();

program
  .version('0.0.1')
  .option('-d, --dir', 'Directory to serve from.', './')
  .option('-p, --port [type]', 'Port to serve on [port]', 8080)
  .option('-a, --address [type]', 'IP sddress to serve on [address]', 'localhost')
  .option('-c, --conf', 'Markconf.js file to use.', 'markserv-conf-github');

const filter = parsed => {
  const filteredArgs = {
    dir: parsed.dir || cwd,
    conf: parsed.conf || cwd + '/' + configFilename,
    port: parsed.port,
    address: parsed.address
  };

  return filteredArgs;
};

const parse = args => {
  const parsed = program.parse(args || process.argv);

  return filter(parsed);
};

module.exports = {
  parse
};
