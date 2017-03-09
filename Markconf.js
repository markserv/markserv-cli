const Markconf = {
	import: 'markserv-contrib-app.github',

	overrides: {
		MarkconfUrl: __filename
	},

	watch: {
		Markconf: true,
		plugins: true,
		files: [
			'**/*.md',
			'**/*.html',
			'!**/tmp/*'
		]
	},

	export: {
		'**/*.md': 'tmp/destmd'
	}
}

module.exports = Markconf
