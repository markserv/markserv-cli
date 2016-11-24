#!/usr/bin/env node

const Promise = require('bluebird');

// Markserv main service
const Markserv = require('app/core.markserv');
const pluginResolver = require('app/plugin-resolver');

const initialize = args => {
  return new Promise((resolve, reject) => {
    const settings = require('app/init.args').parse(args);

    pluginResolver(settings.conf).then(plugins => {
      // console.log('PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS PLUGINS');
      // console.log(plugins);
      // console.log();
      // console.log(plugins.modifiers['**/']);

      const Markconf = require('app/init.markconf').initialize(settings, plugins);

      Markserv.spawnService(Markconf).then(service => {
        console.log('SERVICE SERVICE SERVICE SERVICE SERVICE SERVICE SERVICE SERVICE SERVICE SERVICE');
        console.log(service);
        resolve(service);
      }).catch(err => {
        reject(err);
      });
    })
    .catch(err => {
      reject(err);
    });
  });
};

const CLI = !module.parent;

if (CLI) {
  initialize(process.argv);
}

module.exports = args => {
  const markserv = initialize(args);
  // returns a promise
  return markserv;
};
