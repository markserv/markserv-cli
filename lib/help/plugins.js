const fs = require('app/lib/help/fs');

const configure = conf => {
  fs.configure(conf);
};

module.exports = {
  configure,
  fs
};
