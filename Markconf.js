const Markconf = {
	import: 'markserv-contrib-app.github',

	overrides: {
		MarkconfUrl: __filename
	},

	watch: {
		Markconf: true,
		plugins: true,
		files: [
			'**/*.md!tmp/**/*.md',
			'**/*.html'
		]
	},

	export: {
		'**/*.md': 'tmp/destmd'
	}
}

module.exports = Markconf
