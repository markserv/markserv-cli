global.log.trace('CLI Mode = true');

const markserv = require('./markserv');

module.exports = Markconf => {
  markserv.initialize(Markconf)
    .then(markserv.start);

  return markserv;
};
