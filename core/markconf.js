const path = require('path');

const initialize = args => {
  const MarkconfPath = path.resolve(args.dir);
  const MarkconfDefinition = require(args.conf);

  const Runtime = {

    // Function to re-initialize yje config
    initialize,

    // Arguments passed to the process
    args,

    // ID of the process, user can kill
    pid: process.pid,

    // URL of the running server
    url: 'http://' + args.address + ':' + args.port,

    // Path to the Markconf.js
    path: MarkconfPath,

    // Document root
    serverRoot: args.dir
  };

  // Combine objects to create Markconf
  const initialized = Object.assign(Runtime, initialize, MarkconfDefinition);

  // Write over the export
  module.exports = initialized;

  return initialized;
};

module.exports = {
  initialize
};
