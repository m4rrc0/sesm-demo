const browserConfig = {
  plugins: [
    // ["@snowpack/plugin-svelte", {}],
    ["./plugins/sesm/plugin.js", {}],
  ],
  scripts: {
    "mount:src": "mount src --to /_dist_",
  },
};

const ssrOptions = {
  generate: "ssr",
  // css: true,
};
const ssrConfig = {
  plugins: [["@snowpack/plugin-svelte", ssrOptions]],
  scripts: {
    "mount:ssr": "mount src --to /_dist_",
  },
  devOptions: {
    out: "build-temp",
  },
};

const config = process.env.BUILD_STEP === "ssr" ? ssrConfig : browserConfig;

// see https://www.snowpack.dev/#all-config-options
module.exports = {
  plugins: ["@snowpack/plugin-dotenv", ...config.plugins],
  scripts: {
    // Pipe every .css file through PostCSS CLI
    // "build:css": "postcss",
    "mount:public": "mount public --to /",
    ...config.scripts,
  },
  installOptions: {
    rollup: {
      plugins: [require("rollup-plugin-svelte")()], // necessary to be able to use svelte libraries which make use of .svelte files
    },
  },
  devOptions: { bundle: false, open: "none", ...config.devOptions },
  buildOptions: {
    // clean: true,
    ...config.buildOptions,
  },
  browserConfig,
  ssrConfig,
};
