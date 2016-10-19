module.exports = {
  "data": [
    {"name": "perRequest", "default": true},
    {"name": "singleton"},
    {"name": "unique"}
  ],
  contains(lifeCycle) {
    return Boolean(this.data.find(item => (lifeCycle === item.name)));
  },
  getDefault() {
    return this.data.find(item => Boolean(item.default && item.default === true)).name;
  }
};
