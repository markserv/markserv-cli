module.exports = {
	set: '[Function: set]',

	args: {
		root: './',
		MarkconfUrl: './',
		port: '8000-9000',
		address: 'localhost',
		loglevel: 'INFO',
		MarkconfDefaultsUrl: '/Users/al/ms/markserv-cli/Markconf.Defaults.js'
	},

	MarkconfUrl: '/Users/al/ms/markserv-cli/Markconf.js',

	MarkconfDir: '/Users/al/ms/markserv-cli',

	MarkconfJs: {
		includers: {
			html: 'markserv-contrib-inc.html',
			markdown: 'markserv-contrib-inc.markdown'
		},
		modifiers: {
			404: 'markserv-contrib-mod.http-404',
			'**/': 'markserv-contrib-mod.dir',
			'**/*.html': 'markserv-contrib-mod.html',
			'**/*.md': 'markserv-contrib-mod.markdown',
			'**/*': 'markserv-contrib-mod.file'
		}
	},

	MarkconfDefaults: {
		processIncludesInHttpRequests: true,
		fileTypes: {
			markdown: '[Object]'
		},
		options: {
			root: '[Object]',
			port: '[Object]',
			address: '[Object]',
			conf: '[Object]',
			defaults: '[Object]',
			loglevel: '[Object]'
		}
	},

	pid: 11578,

	root: '/Users/al/ms/markserv-cli',

	plugins: {
		includers: {
			html: '[Object]',
			markdown: '[Object]'
		},
		modifiers: {
			404: '[Object]',
			'**/': '[Object]',
			'**/*.html': '[Object]',
			'**/*.md': '[Object]',
			'**/*': '[Object]'
		}
	},

	helpers: {
		fs: {
			isMarkdownFile: '[Function: isMarkdownFile]',
			directoryExists: '[Function: directoryExists]'
		},
		log: {
			error: '[Function: error]'
		}
	},

	httpServer: {
		shutdown: '[Function]',
		start: '[Function]',
		port: 8000
	},

	isInitialized: true
};
