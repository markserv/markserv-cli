#!/usr/bin/env node

// Markserv main service
const Markserv = require('app/core.markserv');

// Export Markserv for use in other apps
module.exports = Markserv;

// const CLI = !module.parent;

// // Run in client mode if appropriate
// if (CLI) {
const args = require('app/init.args').parse(process.argv);
const plugins = require('app/plugin-resolver')(args.conf);

const Markconf = require('app/init.markconf').initialize(args, plugins);

Markserv.spawnService(Markconf);
// }
