const { composePlugins, withNx } = require("@nx/webpack");
const { withReact } = require("@nx/react");

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  config.ignoreWarnings = [/Failed to parse source map/];

  config.resolve.fallback = {
    crypto: false,
    fs: false,
    path: false,
    os: false,
    net: false,
    stream: false,
    tls: false,
    process: false,
  };

  return config;
});
