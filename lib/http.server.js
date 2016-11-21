const http = require('http');
const Promise = require('bluebird');
const connect = require('connect');

// const liveReload = require('livereload');
// const connectLiveReload = require('connect-livereload');

const log = require('app/core.logger');

let Markconf;
let httpServer;

const configure = conf => {
  Markconf = conf;
  return Markconf;
};

const startConnectApp = props => {
  const connectApp = connect()
    .use('/', props.requestHandler);
  return connectApp;
};

const startHTTPServer = connectApp => {
  const httpServer = http.createServer(connectApp);
  httpServer.listen(Markconf.args.port, Markconf.args.address);
  const modifiedHttpServer = require('http-shutdown')(httpServer);
  return modifiedHttpServer;
};

const kill = () => {
  module.exports.server.http.shutdown(() => {
    log.warn('The HTTP server was shut down.');
  });
};

const start = httpRequestHandler => {
  const connectApp = startConnectApp({
    requestHandler: httpRequestHandler.handleRequest
  });
  const httpServer = startHTTPServer(connectApp);
  module.exports.server = {
    kill,
    connect: connectApp,
    http: httpServer
  };
};

module.exports = {
  httpServer,
  configure,
  start,
  kill
};
