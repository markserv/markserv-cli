#!/usr/bin/env node

require('./core/plugins');

const args = require('./core/filter-args').parse(process.argv);
const Markconf = require('./core/markconf').initialize(args);
const markserv = require('./core/markserv');

markserv.initialize(Markconf)
  .then(markserv.start);

module.exports.markserv = markserv;