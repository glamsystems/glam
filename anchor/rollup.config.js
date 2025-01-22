const terser = require("@rollup/plugin-terser");
const obfuscator = require("rollup-plugin-javascript-obfuscator");

module.exports = {
  input: "anchor/src/index.ts",
  output: [
    {
      file: "dist/anchor/index.cjs.js",
      format: "cjs",
      sourcemap: false,
      plugins: [terser(), obfuscator()],
    },
    {
      file: "dist/anchor/index.esm.js",
      format: "esm",
      sourcemap: false,
      plugins: [terser(), obfuscator()],
    },
  ],
  plugins: [
    // Additional Rollup plugins if needed
  ],
};
