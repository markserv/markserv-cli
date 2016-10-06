#!/usr/bin/env node

const args = require('./core/filterArgs').parse(process.argv);
const Markconf = require('./core/markconf').initialize(args);
const markserv = require('./core/markserv');

markserv.configure(Markconf);
markserv.initialize();
markserv.start();
