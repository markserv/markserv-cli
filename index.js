#!/usr/bin/env node

// Markserv main service
const Markserv = require('./lib/core.markserv');

// Export Markserv for use in other apps
module.exports = Markserv;

// const CLI = !module.parent;

// // Run in client mode if appropriate
// if (CLI) {
const args = require('./lib/init.args').parse(process.argv);
const plugins = require('./lib/plugin-resolver')(args.conf);

console.log(plugins.modifiers);

const Markconf = require('./lib/init.markconf').initialize(args, plugins);
Markserv.spawnService(Markconf);
// }
