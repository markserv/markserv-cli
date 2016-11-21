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
      type: 'console',
      category: 'console-severe',
      layout: {
        type: 'pattern',
        pattern: chalk.bgRed.black(' Markserv ') + ' %[%5.5p%] - ' + chalk.red('%m')
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

const ok = text => {
  return chalk.green(text);
};

const fileLogger = log4js.getLogger('file');
const consoleLogger = log4js.getLogger('console');
const consoleLoggerSevere = log4js.getLogger('console-severe');

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
      String.prototype.__defineGetter__(name, function () { // eslint-disable-line no-use-extend-native/no-use-extend-native
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

const decorate = (level, message, id, importDepth) => {
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
  if (importDepth !== undefined) {
    const dpMsg = depth(importDepth);
    formattedMessage = dpMsg + formattedMessage;
    if (formattedMessageConsole) {
      formattedMessageConsole = dpMsg + formattedMessageConsole;
    }
  }

  if (level === 'error' || level === 'fatal') {
    consoleLoggerSevere[level](formattedMessageConsole || formattedMessage);
  } else {
    consoleLogger[level](formattedMessageConsole || formattedMessage);
  }
  fileLogger[level](formattedMessage);
};

let activeLevel;

const setLevel = level => {
  // File logger is always set to trace
  // Console & severe loggers are set from CLI/Markconf.Defaults.js
  consoleLogger.setLevel(level);
  consoleLoggerSevere.setLevel(level);
  activeLevel = level;
};

const trace = (message, importDepth) => {
  const id = callerId.getData();
  decorate('trace', message, id, importDepth);
};

const debug = (message, importDepth) => {
  const id = callerId.getData();
  decorate('debug', message, id, importDepth);
};

// Messages displayed to the terminal during normal operation
const info = (message, importDepth) => {
  const id = callerId.getData();
  decorate('info', message, id, importDepth);
};

const warn = (message, importDepth) => {
  const id = callerId.getData();
  decorate('warn', message, id, importDepth);
};

const error = (message, importDepth) => {
  const id = callerId.getData();
  const err = new Error(message);
  decorate('error', message, id, importDepth);
  if (activeLevel !== 'FATAL' && activeLevel !== 'OFF') {
    console.error(red(err.stack));
  }
};

const fatal = (message, importDepth) => {
  const id = callerId.getData();
  const err = new Error(message);
  decorate('fatal', message, id, importDepth);
  console.error(red(err.stack));
  process.exit(1);  // eslint-disable-line unicorn/no-process-exit
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
  importDepth: depth,
  red,
  ok,
};
