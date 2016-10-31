const fs = require('./help.fs');
const log = require('./core.logger');

const configure = Markconf => {
  fs.configure(Markconf);
};

module.exports = {
  configure,
  fs,
  log
};
