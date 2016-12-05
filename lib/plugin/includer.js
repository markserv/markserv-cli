const log = require('app/lib/core/log');

const add = props => {
	const [name, IncMod, plugDef, help, conf] = props;

	const pluginName = plugDef.name || name;
	const options = plugDef.options;

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
