const includes = require(__dirname + '/includes');

let Markconf;

const configure = conf => {
  Markconf = conf;
  includes.configure(conf);
};

const initialize = () => {
  includes.add(Markconf.includes).then(data => {
    console.log(data);
  }).catch(err => {
    console.log(err);
  });
};

const start = () => {
};

module.exports = {
  configure,
  initialize,
  start,
};
