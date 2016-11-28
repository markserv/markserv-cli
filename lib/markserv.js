#!/usr/bin/env node

const Markserv = require('app/core/service');
const resolvePlugins = require('app/plugin/resolver');

const initialize = args => new Promise((resolve, reject) => {
  const settings = require('app/core/argv').parse(args);

  resolvePlugins(settings.conf).then(plugins => {
    const Markconf = require('app/core/markconf').initialize(settings, plugins);

    Markserv.spawnService(Markconf)
    .then(resolve)
    .catch(reject);
  })
  .catch(reject);
});

const CLI = !module.parent;

if (CLI) {
  initialize(process.argv);
}

module.exports = args => initialize(args);
