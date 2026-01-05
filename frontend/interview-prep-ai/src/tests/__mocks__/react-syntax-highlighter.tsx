import React from "react";

export const Prism = ({ children }: { children: React.ReactNode }) => (
  <pre>{children}</pre>
);
export const Light = ({ children }: { children: React.ReactNode }) => (
  <pre>{children}</pre>
);

export default {
  Prism,
  Light,
};
