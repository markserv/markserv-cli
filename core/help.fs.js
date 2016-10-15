const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const cwd = process.cwd();

const directoryExists = dir => {
  return new Promise((resolve, reject) => {
    fs.stat(dir, (err, stat) => {
      if (err) {
        return reject(err);
      }

      const isDirectory = stat.isDirectory();
      resolve(isDirectory);
    });
  });
};

const fileExists = filepath => {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        return reject(err);
      }

      const isFile = stat.isFile();
      resolve(isFile);
    });
  });
};

const readfile = filepath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }

      resolve(contents);
    });
  });
};

const npmModuleExists = modname => {
  const sep = path.sep;
  const modpath = cwd + sep + 'node_modules' + sep + modname;
  return directoryExists(modpath);
};

module.exports = {
  directoryExists,
  fileExists,
  npmModuleExists,
  readfile
};
