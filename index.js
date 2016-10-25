#!/usr/bin/env node

// Global Logging to Console & File
global.log = require('./core/logger');

// Prepare args for Markserv Configuration (Markconf)
const args = require('./core/args').parse(process.argv);

// Initialize Markconf to be consumed by Markserv
const Markconf = require('./core/markconf').initialize(args);

// Export the plugin loader as callback fn 'Markserv()'
module.exports = require('./core/plugin');

// Markserv being called from CLI? (Ie: not from a Plugin)
const CLI = !module.parent;

if (CLI) {
  const markserv = require('./core/markserv');

  // Inititalize & Start Markserv
  markserv.initialize(Markconf)
    .then(markserv.start);

  // Export Markserv service for 3rd-party control, Eg: Grunt, other Node app
  module.exports.markserv = markserv;

  // Export helpers for runtime use in Plugins
  require('./core/helper')(Markconf);
}
