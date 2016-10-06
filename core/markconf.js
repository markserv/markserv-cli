const path = require('path');

const initialize = args => {
	const MarkconfPath = path.resolve(args.dir);
  const MarkconfFile = args.conf;
	const Markconf = require(args.conf);

	const Runtime = {

    // Function to re-initialize yje config
    initialize: initialize,

    args: args,
    pid: process.pid,
    url: 'http://' + args.address + ':' + args.port,

    // Path to the Markconf.js
    path: MarkconfPath,
    serverRoot: args.dir,
	};

  return module.exports = Object.assign(Runtime, initialize, Markconf);
};

module.exports = {
  initialize
};
