const markserv = require('./markserv');

global.log.trace('CLI Mode = true');

module.exports = Markconf => {
  markserv.initialize(Markconf)
    .then(markserv.start);

  return markserv;
};
