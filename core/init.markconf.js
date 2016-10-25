const path = require('path');

const initialize = args => {
  const MarkconfPath = path.resolve(args.dir);
  const MarkconfDefinition = require(args.conf);
  const DefaultsDefinition = {defaults: require(args.defaults)};

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
  const initialized = Object.assign(
    // CLI Args
    Runtime,

    // Re-initialization callback
    initialize,

    // Loaded Defaults (can be overridden in conf)
    DefaultsDefinition,

    // The loaded Markconf.js file
    MarkconfDefinition
  );

  // Write over the export
  module.exports = initialized;

  return initialized;
};

module.exports = {
  initialize
};
