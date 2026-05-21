const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];

// Bloquer les modules OpenTelemetry via le resolver
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes("@opentelemetry") ||
    moduleName.includes("@vercel/otel") ||
    moduleName === "opentelemetry"
  ) {
    return { type: "empty" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Patcher le bundle AVANT compilation Hermes
// Remplace import(variable) OTEL par Promise.resolve({})
const originalCustomSerializer = config.serializer?.customSerializer;
config.serializer = {
  ...config.serializer,
  customSerializer: async (entryPoint, preModules, graph, options) => {
    if (originalCustomSerializer) {
      const result = await originalCustomSerializer(entryPoint, preModules, graph, options);
      if (typeof result === "string") {
        return result.replace(
          /import\(\/\*\s*webpackIgnore[^)]*\)\s*\.catch/g,
          "Promise.resolve({}).catch"
        );
      }
      return result;
    }
    // Utiliser le sérialiseur par défaut
    const { bundleToString } = require("metro/src/lib/bundleToString");
    const { baseJSBundle } = require("metro/src/DeltaBundler/Serializers/baseJSBundle");
    const bundle = baseJSBundle(entryPoint, preModules, graph, options);
    let code = bundleToString(bundle).code;
    // Remplacer le dynamic import OTEL variable
    code = code.replace(
      /import\(\/\*[\s\S]*?webpackIgnore[\s\S]*?\*\/\s*OTEL_PKG\)/g,
      "Promise.resolve({})"
    );
    return { code, map: "" };
  },
};

module.exports = config;
