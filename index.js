#!/usr/bin/env node

// Prepare args for Markserv Configuration (Markconf)
const args = require('./lib/init.args').parse(process.argv);

// Markserv main service
const Markserv = require('./lib/core.markserv');

// Export Markserv for use in other apps
module.exports = Markserv;

const confResolver = require('./lib/conf-resolver');

const plugins = confResolver.resolveMarkconf(args.conf);
const Markconf = require('./lib/init.markconf').initialize(args, plugins);

Markserv.spawnService(Markconf);
