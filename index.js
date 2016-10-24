#!/usr/bin/env node

const Markconf = require('./core/initialize-markconf.js');
module.exports = require('./core/plugins.js');

const CLI = !module.parent;

if (CLI) {
  module.exports.markserv = require('./core/initialize-markserv.js')(Markconf);
}
