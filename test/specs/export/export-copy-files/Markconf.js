const Markconf = {
	modifiers: {
		'**/*.md': 'markserv-contrib-mod.markdown'
	},

	export: {
		ignore: [
			'.git',
			'node_modules',
			'tmp'
		],
		copy: {
			'dest/a': ['src/**/*.md'],
			'dest/b': ['src/**/*.*']
		}
	}
}

module.exports = Markconf
