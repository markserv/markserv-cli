module.exports = (path, name) => {
  const cwd = process.cwd();
  const modpath = cwd + '/' + path + '/';
  const modfilepath = modpath + name;

  const activeModule = require(modfilepath);

  return activeModule;
};
