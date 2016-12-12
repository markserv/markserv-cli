const Markconf = {
	// title: 'Markconf Example',

	// serverRoot: 'some-pre-defined-path',

	// defaults: {
	//   fileTypes: {
	//     markdown: [
	//      '.md'
	//    ]
	//   }
	// }

	// watch: {
	//   Markconf: true,
	//   modifiers: true,
	//   includers: true,
	//   templates: true,
	//   paths: true
	// },

	includers: {
		// html: 'markserv-contrib-inc.html',
		// markdown: 'markserv-contrib-inc.markdown',
		// less: 'markserv-contrib-inc.less'
	},

	modifiers: {
		// '**/': {
			// module: 'markserv-contrib-mod.dir',
			// template: 'test/partials/test.html'
		// },
		'**/': 'markserv-contrib-mod.dir',
		'**/*.html': 'markserv-contrib-mod.html',
		'**/*.md': 'markserv-contrib-mod.markdown',
		// '**/*': 'markserv-contrib-mod.file',
		// 404: 'markserv-contrib-mod.http-404'
	}

	// rewrites: {
	// 	'test/redirect-a/**/*': 'test/redirect-b/**/*'
	// }
};

module.exports = Markconf;
