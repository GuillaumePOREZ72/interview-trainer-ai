const React = require("react");

module.exports = {
  motion: {
    div: ({ children, ...props }) =>
      React.createElement("div", props, children),
    span: ({ children, ...props }) =>
      React.createElement("span", props, children),
    button: ({ children, ...props }) =>
      React.createElement("button", props, children),
    p: ({ children, ...props }) => React.createElement("p", props, children),
    ul: ({ children, ...props }) => React.createElement("ul", props, children),
    li: ({ children, ...props }) => React.createElement("li", props, children),
    section: ({ children, ...props }) =>
      React.createElement("section", props, children),
    article: ({ children, ...props }) =>
      React.createElement("article", props, children),
    header: ({ children, ...props }) =>
      React.createElement("header", props, children),
    footer: ({ children, ...props }) =>
      React.createElement("footer", props, children),
    nav: ({ children, ...props }) =>
      React.createElement("nav", props, children),
    form: ({ children, ...props }) =>
      React.createElement("form", props, children),
    input: (props) => React.createElement("input", props),
    textarea: (props) => React.createElement("textarea", props),
    img: (props) => React.createElement("img", props),
    a: ({ children, ...props }) => React.createElement("a", props, children),
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: () => Promise.resolve(),
    set: () => {},
  }),
  useMotionValue: (initial) => ({
    get: () => initial,
    set: () => {},
  }),
  useTransform: () => ({ get: () => 0 }),
  useSpring: () => ({ get: () => 0 }),
  useInView: () => true,
};
