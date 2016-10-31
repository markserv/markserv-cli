const path = require('path');
const fs = require('fs');
const log4js = require('log4js');
const callerId = require('caller-id');
const chalk = require('chalk');

const MarkservLogfile = 'Markserv.log';

try {
  fs.unlinkSync(process.cwd() + '/' + MarkservLogfile);
} catch (err) {
}

log4js.configure({
  appenders: [
    {
      type: 'console',
      category: 'console',
      layout: {
        type: 'pattern',
        pattern: chalk.bgGreen.black(' Markserv ') + chalk.grey(' %[%5.5p%] - %m')
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

const highlight = text => {
  return chalk.yellow(text);
};

const underline = text => {
  return chalk.blue.underline(text);
};

const depth = text => {
  return chalk.magenta('[D:' + text + '] ');
};

const red = text => {
  return chalk.red(text);
};

const fileLogger = log4js.getLogger('file');
const consoleLogger = log4js.getLogger('console');

fileLogger.setLevel('TRACE');

const codes = {
  number: [31, 39],
  key: [32, 39],
  string: [33, 39],
  boolean: [34, 39],
  null: [35, 39]
};

// Append/Prepend strings with color chars

const stropen = color => {
  return '\u001b[' + codes[color][0] + 'm';
};

const strclose = color => {
  return '\u001b[' + codes[color][1] + 'm';
};

for (const color in codes) {
  if ({}.hasOwnProperty.call(codes, color)) {
    (function (name) {
      String.prototype.__defineGetter__(name, function () {
        return stropen(name) + this + strclose(name);
      });
    })(color);
  }
}

function syntaxHighlight(jsObj) {
  let json = JSON.stringify(jsObj, undefined, 2);

  try {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return match[cls];
    });
  } catch (err) {
    throw (err);
  }
}

const decorate = (level, message, id, dp) => {
  const module = path.basename(id.evalOrigin, '.js');
  let formattedMessage;
  let formattedMessageConsole;

  if (level === 'info') {
    // Don't display the module name for info messages (relevancy)
    formattedMessage = message;
  } else {
    formattedMessage = module + ': ' + message;
  }

  if (Array.isArray(message)) {
    formattedMessage = message.join('\n');
  } else if (typeof message === 'object') {
    formattedMessageConsole = syntaxHighlight(message);
    formattedMessage = JSON.stringify(message);
  }

  // Display nest depth if appropriate
  if (dp !== undefined) {
    const dpMsg = depth(dp);
    formattedMessage = dpMsg + formattedMessage;
    if (formattedMessageConsole) {
      formattedMessageConsole = dpMsg + formattedMessageConsole;
    }
  }

  consoleLogger[level](formattedMessageConsole || formattedMessage);
  fileLogger[level](formattedMessage);
};

const setLevel = level => {
  // File logger is always set to trace
  // Console logger is set from CLI/Markconf.Defaults.js
  consoleLogger.setLevel(level);
};

const trace = (message, dp) => {
  const id = callerId.getData();
  decorate('trace', message, id, dp);
};

const debug = (message, dp) => {
  const id = callerId.getData();
  decorate('debug', message, id, dp);
};

// Messages displayed to the terminal during normal operation
const info = (message, dp) => {
  const id = callerId.getData();
  decorate('info', message, id, dp);
};

const warn = (message, dp) => {
  const id = callerId.getData();
  decorate('warn', message, id, dp);
};

const error = (message, dp) => {
  const id = callerId.getData();
  decorate('error', message, id, dp);
};

const fatal = (message, dp) => {
  const id = callerId.getData();
  decorate('fatal', message, id, dp);
};

module.exports = {
  setLevel,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
  hl: highlight,
  ul: underline,
  dp: depth,
  red
};
