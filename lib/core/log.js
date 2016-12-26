const path = require('path');
const fs = require('fs');
const log4js = require('log4js');
const callerId = require('caller-id');
const chalk = require('chalk');

const MarkservLogfile = 'Markserv.log';

//    
// const icon = '  ';
// const icon = '  ';
const icon = '';
// const icon = ' Ms ';
const strapText = ' Markserv ';
// const strapText = '';
const strap = chalk.bgGreen.black(icon) + chalk.bold.black.bgGreen(strapText);
const strapErr = chalk.bgRed.black(icon) + chalk.bold.black.bgRed(strapText);

try {
	fs.unlinkSync(process.cwd() + '/' + MarkservLogfile);
} catch (err) {
}

log4js.configure({appenders: [{
	type: 'console',
	category: 'console',
	layout: {
		type: 'pattern',
		pattern: strap + chalk.grey(' %[%5p%]') + chalk.dim.grey(' ┇ ') + '%m'
	}}, {
		type: 'console',
		category: 'console-severe',
		layout: {
			type: 'pattern',
			pattern: strapErr + chalk.red(' %[%5.5p%]') + chalk.dim.grey(' ┇ ') + chalk.red('%m')
		}
	}, {
		type: 'file',
		filename: 'Markserv.log',
		category: 'file',
		layout: {
			type: 'pattern',
			pattern: '{\n "datetime": "%d",\n "level": "%[%5.5p%]",\n "message": "%m",\n},'
		}}]
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

const green = text => {
	return chalk.green(text);
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
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
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

const LEVEL_ENUM = {
	OFF: 0,
	TRACE: 1,
	DEBUG: 2,
	INFO: 3,
	WARN: 4,
	ERROR: 5,
	FATAL: 6
};

let activeLevel;
let logCount = 0;

const chars = (c, n, col) => {
	let str = '';
	for (let i = 0; i < n - 1; i += 1) {
		if (col) {
			str += chalk[col](c);
		} else {
			str += c;
		}
	}
	return str;
};

const blinkOn = ''; // '\x1b\x5b\x35\x6d';
const blinkOff = ''; // '\x1b\x5b\x30\x6d';
const scrubSeq = '\x1b\x5b\x44';

let initializationEnded = false;
// const baseAnim = '_⣀⣤⣶⣿';
const baseAnim = '⠔⠊⠊⠡';
const finalFrame = ' ';
const progressWidth = 5;
const blockFrames = baseAnim;
const blockFramesCount = blockFrames.length;
const loadingMsg = 'Loading...';
const loadedMsg = chalk.red.bold(`${blinkOn} ACTIVE ${blinkOff}`) + chars(' ', loadingMsg.length);
const colRamp = ['grey', 'blue', 'cyan', 'yellow', 'red'];
// const timerAnim = ['⧖', '⧗'];
const timerAnim = ['', ''];
const timerColRamp = ['grey', 'dim', 'white', 'dim'];
const strapColRamp = ['bgWhite', 'bgGreen', 'bgWhite', 'bgYellow'];
const extraPad = 3;

const blocks = [];
for (let i = 0; i < progressWidth; i += 1) {
	blocks.push(0);
}

const endInitialization = () => {
	if (!initializationEnded && activeLevel !== 'OFF') {
		const scrub = chars(scrubSeq, progressWidth + loadingMsg.length + extraPad + strap.length + icon.length + 3);
		const progress = chars(finalFrame, progressWidth + 1, 'green');
		const timerFrame = '';
		process.stdout.write(`${scrub}${chalk.bgGreen.black(icon)}${chalk.bgGreen.black(strapText)} ${progress} ${chalk.grey.dim('┇')}${timerFrame}${loadedMsg}`);
		process.stdout.write('\n');
		initializationEnded = true;
	}
};

const setLevel = level => {
	// File logger is always set to trace
	// Console & severe loggers are set from CLI/Markconf.Defaults.js
	consoleLogger.setLevel(level);
	consoleLoggerSevere.setLevel(level);
	activeLevel = level;
};

const getLevel = () => {
	return activeLevel;
};

const decorate = (level, message, id, importDepth) => {
	logCount += 1;

	if (LEVEL_ENUM[level.toUpperCase()] < LEVEL_ENUM[activeLevel] && !initializationEnded) {
		const frameNumber = parseInt(logCount / 4, 10) % timerAnim.length;
		const timerColIdx = parseInt(logCount / 2, 10) % timerColRamp.length;
		const strapColIdx = parseInt(logCount / 1, 10) % strapColRamp.length;

		const timerCol = chalk[timerColRamp[timerColIdx]];
		const strapCol = chalk[strapColRamp[strapColIdx]].black;
		const timerFrame = timerCol(timerAnim[frameNumber]);

		const lastBlockIdx = blocks.length - 1;
		let progress = '';
		let scrub = '';

		scrub += chars(scrubSeq, progressWidth + loadingMsg.length + strap.length + extraPad + icon.length + 2);

		if (parseInt(blocks[lastBlockIdx], 10) < blockFramesCount - 1) {
			blocks[lastBlockIdx] += 1;
		}

		for (let i = 0; i < progressWidth - 1; i += 1) {
			if (blocks[i] < blockFrames.length - 1 && blocks[i + 1] === blockFramesCount - 1) {
				blocks[i] += 1;
			}
			if (blocks[i + 1] >= blockFramesCount - 1) {
				blocks[i + 1] = 1;
			}

			const blockState = blocks[i];
			progress += chalk[colRamp[blockState]](blockFrames[blockState]);
		}

		process.stdout.write(`${scrub}${strapCol(icon) + strapCol(strapText)} ${progress}   ${timerFrame} ${timerCol(loadingMsg)}`);
	} else if (!initializationEnded) {
		endInitialization();
	}

	let module = path.basename(id.evalOrigin, '.js');
	let formattedMessage;
	let formattedMessageConsole;

	module = chalk.dim(module + '.js > ');

	if (level === 'info') {
		// Don't display the module name for info messages (relevancy)
		formattedMessage = message;
	} else if (level === 'error') {
		// formattedMessage = '❌  ' + module + message;
		formattedMessage = module + message;
	} else if (level === 'fatal') {
		// formattedMessage = '🚫  ' + module + message;
		formattedMessage = module + message;
	} else {
		formattedMessage = module + message;
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

	fileLogger[level](formattedMessage);

	const outputMessage = formattedMessageConsole || formattedMessage;

	if (level === 'error' || level === 'fatal') {
		consoleLoggerSevere[level](outputMessage);
	} else {
		consoleLogger[level](outputMessage);
	}
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
	// This log to console is intentional as it will give a better stack trace
	// than throwing an error on a native promise (bluebird)
	// console.log(message); // ✅
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
	if (activeLevel !== 'OFF') {
		console.error(red(err.stack));
	}
	// process.exit(1);  // eslint-disable-line unicorn/no-process-exit
};

const _console = message => {
	// This log to console is intentional as it will give a better stack trace
	// than throwing an error on a native promise (bluebird)
	console.log(message); // ✅
};

module.exports = {
	endInitialization,
	setLevel,
	getLevel,
	trace,
	debug,
	info,
	warn,
	error,
	fatal,
	console: _console,
	hl: highlight,
	ul: underline,
	importDepth: depth,
	red,
	green,
	ok
};
