const http = require('http');
const Promise = require('bluebird');
const connect = require('connect');
// const liveReload = require('livereload');
// const connectLiveReload = require('connect-livereload');

let Markconf;

const configure = conf => {
  Markconf = conf;
  return Markconf;
};

const startConnectApp = props => {
  return new Promise(resolve => {
    const connectApp = connect()
      .use('/', props.requestHandler);
    resolve(connectApp);
  });
};

const startHTTPServer = connectApp => {
  console.log(Markconf.args);
  return new Promise(resolve => {
    const httpServer = http.createServer(connectApp);
    httpServer.listen(Markconf.args.port, Markconf.args.address);
    resolve(httpServer);
  });
};

const start = httpRequestHandler => {
  return startConnectApp({
    requestHandler: httpRequestHandler.handleRequest
  })
  .then(startHTTPServer);
};

module.exports = {
  configure,
  start
};
