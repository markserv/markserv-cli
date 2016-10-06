const program = require('commander');
const pkg = require('../package.json');

const configFilename = pkg.settings.configFilename;
const cwd = process.cwd();

program
  .version('0.0.1')
  .option('-d, --dir', 'Directory to serve from.', './')
  .option('-c, --conf', 'Markconf.js file to use.', 'markserv-conf-github');

const filter = parsed => {

  let filteredArgs = {
    dir: parsed.dir || cwd,
    conf: parsed.conf || cwd + '/' + configFilename,
  };

  return filteredArgs;
};

const parse = args => {
  var parsed = program.parse(args || process.argv);

  return filter(parsed);
};

module.exports = {
  parse,
};
