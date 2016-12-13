// const Markconf = {

// 	// watch: {
// 	//   Markconf: true,
// 	//   modifiers: true,
// 	//   includers: true,
// 	//   templates: true,
// 	//   paths: true
// 	// },

// 	includers: {
// 		html: 'markserv-contrib-inc.html',
// 		markdown: 'markserv-contrib-inc.markdown',
// 		less: 'markserv-contrib-inc.less'
// 	},

// 	modifiers: {
// 		// '**/': {
// 			// module: 'markserv-contrib-mod.dir',
// 			// template: 'test/partials/test.html'
// 		// },
// 		'**/': 'markserv-contrib-mod.dir',
// 		'**/*.html': 'markserv-contrib-mod.html',
// 		'**/*.md': 'markserv-contrib-mod.markdown',
// 		'**/*': 'markserv-contrib-mod.file',
// 		404: 'markserv-contrib-mod.http-404'
// 	}
// };

// module.exports = Markconf;

module.exports = require('markserv-contrib-app.github');
