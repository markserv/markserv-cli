module.exports = {
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
      value: 8080,
      flag: '-p'
    },
    address: {
      help: 'IP Address or Hostname to serve on [address]',
      value: 'localhost',
      flag: '-a'
    },
    markconf: {
      help: 'Markconf.js file to use [Markconf]',
      value: './Markconf.js',
      flag: '-m'
    },
    defaults: {
      help: 'Markconf.Defaults.js file to use [defaults]',
      value: './Markconf.Defaults.js',
      flag: '-d'
    },
    loglevel: {
      help: 'Logging verbosity: TRACE, DEBUG, INFO, WARN, ERROR, FATAL [loglevel]',
      value: 'INFO',
      flag: '-l'
    }
  }
};
