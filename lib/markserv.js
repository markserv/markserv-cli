#!/usr/bin/env node

// Markserv main service
const Markserv = require('app/core.markserv');

const initialize = args => {
  const settings = require('app/init.args').parse(args);
  // console.log(settings);
  const plugins = require('app/plugin-resolver')(settings.conf);
  const Markconf = require('app/init.markconf').initialize(settings, plugins);
  return Markserv.spawnService(Markconf);
};

const CLI = !module.parent;
if (CLI) {
  initialize(process.argv);
}

module.exports = args => {
  return initialize(args);
};
