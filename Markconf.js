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
			// '**/*.md!tmp/**/*.md',
			// '**/*.html!tmp/**/*.html'
		]
	},

	// export: {
	// 	'**/*.md': 'tmp/destmd'
	// }
}

module.exports = Markconf
