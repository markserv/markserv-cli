#!/usr/bin/env node
global.log = require('./core/logging');
const Markconf = require('./core/initialize-markconf.js');
module.exports = require('./core/plugins.js');

const CLI = !module.parent;

if (CLI) {
  module.exports.markserv = require('./core/initialize-markserv.js')(Markconf);
}
