const Promise = require('bluebird');

const Markserv = require('app/lib/core/service');
const resolvePlugins = require('app/lib/plugin/resolver');
const log = require('app/lib/core/log');

const initialize = args => new Promise((resolve, reject) => {
  const settings = require('app/lib/core/argv').parse(args);

  resolvePlugins(settings.conf).then(plugins => {
    const Markconf = require('app/lib/core/markconf').initialize(settings, plugins);

    Markserv.spawnService(Markconf)
    .then(resolve)
    .catch(reject);
  })
  .catch(reject);
});

const CLI = !module.parent.parent;

if (CLI) {
  initialize(process.argv);
}

module.exports = args => initialize(args);
