module.exports = (plugin, markserv) => {
  return () => {
    return new Promise(resolve => {
      resolve({
        plugin,
        markserv
      });
    });
  };
};
