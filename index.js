#!/usr/bin/env node

// Prepare args for Markserv Configuration (Markconf)
const args = require('./lib/init.args').parse(process.argv);

const confResolver = require('./lib/conf-resolver');

module.exports.plugin = require('./lib/core.plugin');

const Markconf = confResolver.resolveMarkconf(args.conf);

console.log(Markconf);

// // Initialize Markconf to be consumed by Markserv
// const Markconf = require('./lib/init.markconf').initialize(args);

// // Markserv main service
// const Markserv = require('./lib/core.markserv');

// Markserv.spawnService(Markconf);

// // Start Markserv service
// module.exports = Markserv;
