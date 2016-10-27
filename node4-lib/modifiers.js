"use strict";

module.exports = {
  "factory": {
    isFactory: function isFactory(vertexName) {

      const re = /Factory$/;

      return re.test(vertexName);
    },
    chop: function chop(vertexName) {
      return vertexName.split("Factory")[0];
    }
  },
  "optional": {
    isOptional: function isOptional(vertexName) {

      const re = /\?$/;

      return re.test(vertexName);
    },
    chop: function chop(vertexName) {
      return vertexName.split("?")[0];
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9tb2RpZmllcnMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImlzRmFjdG9yeSIsInZlcnRleE5hbWUiLCJyZSIsInRlc3QiLCJjaG9wIiwic3BsaXQiLCJpc09wdGlvbmFsIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2YsYUFBVztBQUNUQyxhQURTLHFCQUNDQyxVQURELEVBQ2E7O0FBRXBCLFlBQU1DLEtBQUssVUFBWDs7QUFFQSxhQUFPQSxHQUFHQyxJQUFILENBQVFGLFVBQVIsQ0FBUDtBQUNELEtBTlE7QUFPVEcsUUFQUyxnQkFPSkgsVUFQSSxFQU9RO0FBQ2YsYUFBT0EsV0FBV0ksS0FBWCxDQUFpQixTQUFqQixFQUE0QixDQUE1QixDQUFQO0FBQ0Q7QUFUUSxHQURJO0FBWWYsY0FBWTtBQUNWQyxjQURVLHNCQUNDTCxVQURELEVBQ2E7O0FBRXJCLFlBQU1DLEtBQUssS0FBWDs7QUFFQSxhQUFPQSxHQUFHQyxJQUFILENBQVFGLFVBQVIsQ0FBUDtBQUNELEtBTlM7QUFPVkcsUUFQVSxnQkFPTEgsVUFQSyxFQU9PO0FBQ2YsYUFBT0EsV0FBV0ksS0FBWCxDQUFpQixHQUFqQixFQUFzQixDQUF0QixDQUFQO0FBQ0Q7QUFUUztBQVpHLENBQWpCIiwiZmlsZSI6Im1vZGlmaWVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0ge1xuICBcImZhY3RvcnlcIjoge1xuICAgIGlzRmFjdG9yeSh2ZXJ0ZXhOYW1lKSB7XG5cbiAgICAgIGNvbnN0IHJlID0gL0ZhY3RvcnkkLztcblxuICAgICAgcmV0dXJuIHJlLnRlc3QodmVydGV4TmFtZSk7XG4gICAgfSxcbiAgICBjaG9wKHZlcnRleE5hbWUpIHtcbiAgICAgIHJldHVybiB2ZXJ0ZXhOYW1lLnNwbGl0KFwiRmFjdG9yeVwiKVswXTtcbiAgICB9XG4gIH0sXG4gIFwib3B0aW9uYWxcIjoge1xuICAgIGlzT3B0aW9uYWwodmVydGV4TmFtZSkge1xuXG4gICAgICBjb25zdCByZSA9IC9cXD8kLztcblxuICAgICAgcmV0dXJuIHJlLnRlc3QodmVydGV4TmFtZSk7XG4gICAgfSxcbiAgICBjaG9wKHZlcnRleE5hbWUpIHtcbiAgICAgIHJldHVybiB2ZXJ0ZXhOYW1lLnNwbGl0KFwiP1wiKVswXTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
