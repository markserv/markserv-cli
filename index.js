#!/usr/bin/env node

const args = require('./core/filter-args').parse(process.argv);
const Markconf = require('./core/markconf').initialize(args);
const markserv = require('./core/markserv');

markserv.initialize(Markconf)
  .then(markserv.start);
