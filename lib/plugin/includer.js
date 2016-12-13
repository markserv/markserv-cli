const log = require('app/lib/core/log');

module.exports = config => props => {
	const [
		pluginName,
		pluginPath,
		pluginExports
	] = props;

	log.trace(`Registering includer: ${log.ul(pluginPath)}.`);

	const exports = {};

	exports.name = pluginExports.name || pluginName;
	exports.options = pluginExports.options;

	exports.setOptions = newOpts => {
		exports.options = newOpts;
	};

	exports.configure = conf => new Promise(resolve => {
		log.trace('Modifier ' + log.hl(exports.name) + ' received a new Markconf configuration.');
		config = conf;
		exports.htmlCommentIncluder = pluginExports.plugin(pluginExports, config);
		resolve(exports);
	});

	return exports;
};
