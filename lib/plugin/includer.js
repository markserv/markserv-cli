const path = require('path');

const log = require('app/lib/core/log');

const add = props => {
	const [name, modPath, IncMod, plugDef, help, conf] = props;
	console.log('++++++++++++++++++++++++++++++++++++++++++++');
	log.trace('Registering includer: ' + modPath);

	const pluginName = plugDef.name || name;
	const options = plugDef.options;

	const scriptDir = path.dirname(modPath);
	console.log(scriptDir);

	const configure = conf => new Promise(resolve => {
		log.trace('Modifier ' + log.hl(name) + ' received a new Markconf configuration.');
		IncMod.exports.Markconf = conf;
		resolve();
	});

	IncMod.exports = {
		name: pluginName,
		Markconf: conf,
		configure
	};

	const htmlCommentIncluder = plugDef.plugin(IncMod.exports, help, options, conf);
	IncMod.exports.htmlCommentIncluder = htmlCommentIncluder;

	return IncMod.exports;
};

module.exports = {
	add
};
