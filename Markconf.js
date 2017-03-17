const Markconf = {
	import: 'markserv-contrib-app.github',

	overrides: {
		MarkconfUrl: __filename
	},

	// watch: {
	// 	Markconf: true,
	// 	plugins: true,
	// 	files: [
	// 		'**/*.md',
	// 		'**/*.html',
	// 		'!tmp/'
	// 	]
	// },

	// export: {
	// 	ignore: [
	// 		'.git',
	// 		'node_modules',
	// 		'tmp'
	// 	],
	// 	serve: {
	// 		'tmp/destmd': ['**/*.md']
	// 	},
	// 	copy: {
	// 		'tmp/destmd': ['**/*.json']
	// 	}
	// }
}

module.exports = Markconf
