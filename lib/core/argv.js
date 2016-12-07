const path = require('path');

const pkg = require('app/package.json');
const log = require('app/lib/core/log');
const helpFs = require('app/lib/help/fs')();

const cwd = process.cwd();

const configFilepath = path.join(cwd, pkg.settings.configFilename);

const localDefaultsFilepath = path.join(cwd, pkg.settings.defaultsFilename);
const defaultsFileFound = helpFs.fileExistsSync(localDefaultsFilepath);

let defaults;
let appDefaultsFilepath;

if (defaultsFileFound) {
	defaults = require(localDefaultsFilepath);
} else {
	appDefaultsFilepath = path.join('app', pkg.settings.defaultsFilename);
	defaults = require(appDefaultsFilepath);
}

const setup = options => {
	const Command = require('commander').Command;
	const program = new Command(process.argv);
	program.version(pkg.version);

	for (const name in options) {
		if (!{}.hasOwnProperty.call(options, name)) {
			continue;
		}
		const option = options[name];
		const flag = option.flag + ' --' + name + ' [type]';
		program.option(flag, option.help, option.value);
	}

	return program;
};

// Only these args will fall through to the Markconf object
const filter = parsed => {
	const filteredArgs = {
		root: parsed.root || cwd,
		MarkconfUrl: parsed.conf || configFilepath,
		port: parsed.port,
		address: parsed.address,
		loglevel: parsed.loglevel,
		MarkconfDefaultsUrl: localDefaultsFilepath || appDefaultsFilepath
	};

	return filteredArgs;
};

const parseDefaultOptions = (defaults, args) => {
	const program = setup(defaults.options);
	const parsed = program.parse(args || process.args);
	return parsed;
};

const parse = args => {
	const parsed = parseDefaultOptions(defaults, args);
	const filteredArgs = filter(parsed, defaults);
	log.setLevel(filteredArgs.loglevel);
	return filteredArgs;
};

module.exports = parse;
