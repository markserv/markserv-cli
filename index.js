#!/usr/bin/env node

const Markconf = require('./core/load-configuration');

module.exports = require('./core/export-plugin');

if (!module.parent) {
  module.exports.markserv = require('./core/export-markserv')(Markconf);
}
