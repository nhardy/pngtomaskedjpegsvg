/**
 * This file needs to Vanilla JavaScript that can be executed in the current Node environment as Babel cannot know what
 * transformations it would need to apply before reading this file
 */

module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      }
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    [
      "@babel/plugin-transform-runtime",
      { regenerator: false },
    ],
    "babel-plugin-lodash",
  ],
  env: {
    test: {
      plugins: [
        "babel-plugin-istanbul",
      ],
    },
  },
};
