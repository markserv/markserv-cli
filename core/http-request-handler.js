// const fs = require('fs');
// const minimatch = require('minimatch');

let Markconf;

const configure = conf => {
  Markconf = conf;
  return Markconf;
};

const handleRequest = (req, res, next) => {
  console.log(".");
  console.log(req, res, next);
};

module.exports = {
  configure,
  handleRequest
};

