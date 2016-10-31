// const path = require('path');
const Promise = require('bluebird');

const log = require('./core.logger');
const help = require('./core.help');
const plugin = require('./core.plugin');

const httpRequestHandler = require('./http.request-handler');
const httpServer = require('./http.server');

// Friendly Ctrl + C Termination
require('./core.sigint')(process);

const markserv = () => {
  let Markconf;

  const loadedIncluders = {};
  const loadedCoreModifiers = {};
  const loadedPathModifiers = {};
  const activeMarkconf = {};

  const service = {
    help,

    Markconf,
    activeMarkconf,

    loadedIncluders,
    loadedCoreModifiers,
    loadedPathModifiers,

    configure: conf => {
      log.trace('Markserv received new configuration.');
      Markconf = conf;
      httpServer.configure(conf);
      httpRequestHandler.configure(conf);
      return service;
    },

    startServer: activeMarkconf => {
      log.trace('Starting Markserv...');
      console.log(activeMarkconf);
      httpServer.configure(activeMarkconf);
      httpServer.start(httpRequestHandler);
      log.trace('Markserv started successfully.');
      return service;
    }
  };

  return service;
};

const spawnService = conf => {
  const Service = markserv();

  Service
    .configure(conf)
    .startServer(conf);

  return Service;
};

module.exports = {
  spawnService,
  help,
  plugin
};
