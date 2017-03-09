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
			'**/*.html'
		]
	},

	export: {
		'**/*.md': 'dest/',
		'**/*.html': 'dest/'
	}
}

module.exports = Markconf
