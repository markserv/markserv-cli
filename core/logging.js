const log4js = require('log4js');

log4js.configure({
  appenders: [
    {
      type: 'console',
      category: 'console'
    },
    {
      type: 'file',
      filename: 'Markserv.log',
      category: 'file'
    }
  ]
});

const fileLogger = log4js.getLogger('file');
const consoleLogger = log4js.getLogger('console');

const setLevel = level => {
  fileLogger.setLevel(level);
  consoleLogger.setLevel(level);
};

const trace = message => {
  fileLogger.trace(message);
  consoleLogger.trace(message);
};

const debug = message => {
  fileLogger.debug(message);
  consoleLogger.debug(message);
};

const info = message => {
  fileLogger.info(message);
  consoleLogger.info(message);
};

const warn = message => {
  fileLogger.warn(message);
  consoleLogger.warn(message);
};

const error = message => {
  fileLogger.error(message);
  consoleLogger.error(message);
};

const fatal = message => {
  fileLogger.fatal(message);
  consoleLogger.fatal(message);
};

module.exports = {
  setLevel,
  trace,
  debug,
  info,
  warn,
  error,
  fatal
};
