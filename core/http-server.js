// const Promise = require('bluebird');
// const connect = require('connect');
// const http = require('http');
// const liveReload = require('livereload');
// const connectLiveReload = require('connect-livereload');

let Markconf;

const configure = conf => {
  Markconf = conf;
  return Markconf;
};

const start = () => {
  console.log('httpServer Start');
};

module.exports = {
  configure,
  start
};
