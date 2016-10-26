const Sigint = require('sigint');
const log = require('./core.logger');

const sigint = Sigint.create();

const sigintDelay = 1000;
let lastSigintTime = null;
let sigintCount = 0;

module.exports = p => {
  sigint.on('signal', source => {
    const now = Number(new Date());

    if (source === 'keyboard' && sigintCount === 0) {
      sigintCount = 1;
      log.info('Press Ctrl + C again to exit Markserv.');
      lastSigintTime = now;
    } else if (source === 'keyboard' && sigintCount === 1) {
      sigintCount = 0;

      if (now - lastSigintTime < sigintDelay) {
        log.info('Exiting Markserv...');
        p.exit();
      } else {
        log.info('You are not presssing Ctrl + C quickly enough to exit Markserv.');
        lastSigintTime = now;
        sigintCount = 0;
      }
    }
  });
};
