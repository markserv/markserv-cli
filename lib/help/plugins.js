const fs = require('app/help/fs');

const configure = conf => {
  fs.configure(conf);
};

module.exports = {
  configure,
  fs
};
