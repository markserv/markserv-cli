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
			// '**/*.html'
		]
	},

	export: {
		'**/*.md': 'dest/'
	}
};

module.exports = Markconf;

// const Markconf = {
// 	// import: 'markserv-contrib-app.github',

// 	modifiers: {
// 		'**/': 'markserv-contrib-mod.dir',
// 		'**/*.html': 'markserv-contrib-mod.html'
// 	},

// 	watch: {
// 		// Markconf: true,
// 		// plugins: true,
// 		files: [
// 			'
// 		]
// 	}
// };

// module.exports = Markconf;

