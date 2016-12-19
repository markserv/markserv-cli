module.exports = {
	// Should the HTTP Request Handler use the template compiler for content that
	// is served at run-time?
	processIncludesInHttpRequests: true,
	fileTypes: {
		markdown: [
			'.md',
			'.markdown',
			'.mdown',
			'.mkdn',
			'.mkd',
			'.mdwn',
			'.mdtxt',
			'.mdtext',
			'.text'
		]
	},
	options: {
		root: {
			help: 'Root directory to serve, eg: htdocs/public/static [root]',
			value: './',
			flag: '-r'
		},
		port: {
			help: 'Port to serve on [port]',
			value: '8000-9000',
			flag: '-p'
		},
		address: {
			help: 'IP Address or Hostname to serve on [address]',
			value: 'localhost',
			flag: '-a'
		},
		conf: {
			help: 'Markconf.js file to use [conf]',
			value: './',
			flag: '-c'
		},
		defaults: {
			help: 'Markconf.Defaults.js file to use [defaults]',
			value: './lib/Markconf.Defaults.js',
			flag: '-d'
		},
		loglevel: {
			help: 'Logging verbosity: OFF, TRACE, DEBUG, INFO, WARN, ERROR, FATAL [loglevel]',
			value: 'INFO',
			flag: '-l'
		}
	}
};
