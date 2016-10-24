const Markserv = require('../../../../../index');

Markserv.plugin.modifier(module, 'markserv-mod-local', (Markconf, template) => {
  return requestPath => {
    return new Promise(resolve => {
      if (!Markconf || !template) {
        // reject('Err: No request path');
      }

      const result = requestPath;

      // Pass Back to HTTP Request Handler or HTTP Exporter
      const payload = {
        statusCode: 200,
        contentType: 'text/html',
        data: result
      };

      // return payload;
      resolve(payload);
    });
  };
});
