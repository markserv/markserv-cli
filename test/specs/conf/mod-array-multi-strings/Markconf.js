const Markconf = {
	modifiers: {
		'**/*.*': [
			// These two mods should not be used together.
			// We are just showing that we can load multiple mods into the stack.
			'markserv-contrib-mod.file',
			'markserv-contrib-mod.dir'
		]
	}
};

module.exports = Markconf;
