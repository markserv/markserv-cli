module.exports = (module, initFn) => {
  console.log(module);
  const template = module.exports.template;
  module.exports = initFn(template);
};
