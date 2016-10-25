#!/usr/bin/env node
global.log = require('./core/logging');

const Markconf = require('./core/initialize-markconf.js');

module.exports = require('./core/plugin-arch');

const CLI = !module.parent;

if (CLI) {
  const markserv = require('./core/initialize-markserv.js')(Markconf);
  module.exports.markserv = markserv;
  module.exports.helpers = require('./core/helpers');
}

