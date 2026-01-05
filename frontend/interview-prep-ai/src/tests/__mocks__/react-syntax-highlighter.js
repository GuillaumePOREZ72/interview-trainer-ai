const React = require("react");

module.exports = {
  Prism: ({ children }) => React.createElement("pre", null, children),
  Light: ({ children }) => React.createElement("pre", null, children),
};
