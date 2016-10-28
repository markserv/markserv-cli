#!/usr/bin/env node

const confResolver = require('./lib/conf-resolver');

const markservModifiers = confResolver.resolveMarkconf();

console.log(markservModifiers);

// console.log(Markconf);

// // Prepare args for Markserv Configuration (Markconf)
// const args = require('./lib/init.args').parse(process.argv);

// // Initialize Markconf to be consumed by Markserv
// const Markconf = require('./lib/init.markconf').initialize(args);

// // Markserv main service
// const Markserv = require('./lib/core.markserv');

// Markserv.spawnService(Markconf);

// // Start Markserv service
// module.exports = Markserv;
