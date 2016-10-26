const path = require('path');
const fs = require('fs');
const log4js = require('log4js');
const callerId = require('caller-id');
const colors = require('colors');

const MarkservLogfile = 'Markserv.log';

fs.unlinkSync(process.cwd() + '/' + MarkservLogfile);

log4js.configure({
  appenders: [
    {
      type: 'console',
      category: 'console',
      layout: {
        type: 'pattern',
        pattern: ' MS⬇ '.bgBlue.white + ' %[%5.5p%] - %m'
      }
    },
    {
      type: 'file',
      filename: 'Markserv.log',
      category: 'file',
      layout: {
        type: 'pattern',
        pattern: '\
{\n\
  "datetime": "%d",\n\
  "level": "%[%5.5p%]",\n\
  "message": "%m",\n\
},'
      }
    }
  ]
});

const fileLogger = log4js.getLogger('file');
const consoleLogger = log4js.getLogger('console');

fileLogger.setLevel('TRACE');

const decorate = (level, message, id) => {
  const module = path.basename(id.evalOrigin, '.js');
  const formattedMessage = module + ': ' + message;
  consoleLogger[level](formattedMessage);
  fileLogger[level](formattedMessage);
};

const setLevel = level => {
  // File logger is always set to trace
  // Console logger is set from CLI/Markconf.Defaults.js
  consoleLogger.setLevel(level);
};

const trace = message => {
  const id = callerId.getData();
  decorate('trace', message, id);
};

const debug = message => {
  const id = callerId.getData();
  decorate('debug', message, id);
};

const info = message => {
  const id = callerId.getData();
  decorate('info', message, id);
};

const warn = message => {
  const id = callerId.getData();
  decorate('warn', message, id);
};

const error = message => {
  const id = callerId.getData();
  decorate('error', message, id);
};

const fatal = message => {
  const id = callerId.getData();
  decorate('fatal', message, id);
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
