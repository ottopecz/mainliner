module.exports = {
  "factory": {
    isFactory(vertexName) {

      const re = /Factory$/;

      return re.test(vertexName);
    },
    chop(vertexName) {
      return vertexName.split("Factory")[0];
    }
  },
  "optional": {
    isOptional(vertexName) {

      const re = /\?$/;

      return re.test(vertexName);
    },
    chop(vertexName) {
      return vertexName.split("?")[0];
    }
  }
};
