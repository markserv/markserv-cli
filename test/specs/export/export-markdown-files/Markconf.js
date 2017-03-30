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
		serve: {
			'dest/a': ['src/**/*ee*.md'],
			'dest/b': ['src/**/*es*.md']
		}
	}
}

module.exports = Markconf
