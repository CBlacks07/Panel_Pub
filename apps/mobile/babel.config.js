module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Transforme les dynamic import() en require() compatible Hermes
      "@babel/plugin-transform-dynamic-import",
    ],
  };
};
