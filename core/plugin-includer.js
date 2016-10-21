module.exports = (module, httpResponseModifier) => {
  module.template = module.exports.template;
  module.exports = httpResponseModifier;
};
