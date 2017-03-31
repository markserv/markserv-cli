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
	watch: {
		ignore: [
			'node_modules',
			'.git',
			'.svn',
			'.hg',
			'tmp'
		]
	},
	export: {
		ignore: [
			'node_modules',
			'.git',
			'.svn',
			'.hg',
			'tmp'
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
			help: 'Markconf.Defaults.js file to use [Markconf.Defaults.js]',
			value: './lib/Markconf.Defaults.js',
			flag: '-d'
		},
		loglevel: {
			help: 'Logging level: OFF, TRACE, DEBUG, INFO, WARN, ERROR, FATAL [type]',
			value: 'INFO',
			flag: '-l'
		},
		open: {
			help: 'Open browser [open]',
			value: false,
			flag: '-o'
		},
		browsersyncLogLevel: {
			help: 'Browsersync loglevel: info, debug, warn, silent [browsersyncLogLevel]',
			value: 'silent',
			flag: '-b'
		},
		browsersyncNofity: {
			help: 'Browsersync notifify: true, false [browsersyncNofity]',
			value: 'false',
			flag: '-n'
		}
	}
}
