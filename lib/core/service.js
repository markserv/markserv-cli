// const path = require('path');
const Promise = require('bluebird');

const log = require('app/lib/core/log');
const plugin = require('app/lib/plugin/register');
const help = require('app/lib/help/plugins');

const httpRequestHandler = require('app/lib/http/requests');
const httpServer = require('app/lib/http/server');
const templateCompiler = require('app/lib/http/compiler');

require('app/lib/core/shutdown')(process);

const configureStack = (stack, Markconf) => {
  return new Promise((resolve, reject) => {
    const promiseStack = [];

    for (const pluginName in stack) {
      if ({}.hasOwnProperty.call(stack, pluginName)) {
        log.trace(`Configuring core modifier plugin: ${log.hl(pluginName)}`);

        const plugin = stack[pluginName];
        const definitionType = Array.isArray(plugin) ? 'array' : 'object';

        if (definitionType === 'object') {
          promiseStack.push(plugin.configure(Markconf));
        } else if (definitionType === 'array') {
          for (const subPlug of plugin) {
            promiseStack.push(subPlug.configure(Markconf));
          }
        }
      }
    }

    Promise.all(promiseStack).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  });
};

const configurePlugins = Markconf => {
  return new Promise((resolve, reject) => {
    log.trace('Markserv is configuring plugins....');

    if ({}.hasOwnProperty.call(Markconf, 'plugins') === false) {
      const warn = 'No plugins were found to configure.';
      log.warn(warn);
      return reject(warn);
    }

    if ({}.hasOwnProperty.call(Markconf.plugins, 'modifiers') === false) {
      const err = 'No ' + log.hl('modifier') + ' plugins were found to configure.';
      log.error(err);
      return reject(err);
    }

    const modifiers = Markconf.plugins.modifiers;

    let modCount = 0;
    for (const name in modifiers) {
      if ({}.hasOwnProperty.call(modifiers, name)) {
        modCount += 1;
      }
    }

    if (modCount > 0) {
      configureStack(modifiers, Markconf).then(() => {
        resolve(modifiers);
      }).catch(err => {
        reject(err);
      });
      return;
    }

    const fatal = 'No ' + log.hl('core') + ' modifier plugins were found to configure.';
    log.fatal(fatal);
    reject(fatal);
  });
};

const markserv = () => {
  const service = {
    Markconf: undefined,
    httpServer: undefined,
    isInitialized: false,

    // help: {},

    configure: conf => {
      return new Promise((resolve, reject) => {
        log.trace('Markserv service received new configuration.');

        service.Markconf = conf;

        // Templates are loaded before modifiers
        templateCompiler.configure(conf);

        configurePlugins(conf)
        .then(() => {
          log.trace('Markserv finished configuring plugins.');
          service.isInitialized = true;

          help.configure(conf);
          httpServer.configure(conf);
          httpRequestHandler.configure(conf);
          // help.configure(service.Markconf);

          service.httpServer = httpServer;
          service.httpRequestHandler = httpRequestHandler;

          // Plugin helpers are attached here
          service.help = {};

          resolve(service);
        })
        .catch(err => {
          log.error(err);
          reject(err);
        });
      });
    },

    startServer: conf => new Promise((resolve, reject) => {
      log.trace('Starting Markserv...');
      httpServer.configure(conf);

      httpServer.start(httpRequestHandler).then(() => {
        service.httpServer = httpServer.server;
        resolve();
      }).catch(err => {
        reject(err);
      });

      log.trace('Markserv http server started successfully.');
    }),

    kill: () => {
      if ({}.hasOwnProperty.call(service, 'httpServer')) {
        service.httpServer.kill();
        // can we kill connect app too, or is that irrelavent?
      }
      return service;
    }
  };

  return service;
};

const spawnService = conf => new Promise(resolve => {
  const service = markserv();
  // fix all this ugly nesting..
  service.configure(conf).then(() => {
    service.startServer(conf).then(() => {
      resolve(service);
    }).catch(err => {
      log.error(err);
    // We want to pass back the service so we can test what failed
      resolve(service);
    });
  })
  .catch(err => {
    log.error(err);
    // We want to pass back the service so we can test what failed
    resolve(service);
  });
});

module.exports = {
  spawnService,
  plugin
};
