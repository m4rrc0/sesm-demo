const fs = require("fs").promises;
const { existsSync } = require("fs");
const path = require("path");
const svelte = require("svelte/compiler");

const outputHtml = ({ componentPath = "/_dist_/_pages/index.js" }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Web site created using create-snowpack-app"
    />
    <title>Snowpack App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <script type="module">
      import Comp from "${componentPath}";
      new Comp({
        target: document.querySelector("body"),
        hydrate: true,
      });
    </script>
  </body>
</html>
`;

module.exports = function plugin(snowpackConfig, pluginOptions) {
  let svelteOptions;
  let preprocessOptions;
  const userSvelteConfigLoc = path.join(process.cwd(), "svelte.config.js");
  if (existsSync(userSvelteConfigLoc)) {
    const userSvelteConfig = require(userSvelteConfigLoc);
    const { preprocess, ..._svelteOptions } = userSvelteConfig;
    preprocessOptions = preprocess;
    svelteOptions = _svelteOptions;
  }
  // Generate svelte options from user provided config (if given)
  svelteOptions = {
    dev: process.env.NODE_ENV !== "production",
    css: false,
    ...svelteOptions,
    ...pluginOptions,
  };

  return {
    defaultBuildScript: "build:svelte",
    knownEntrypoints: ["svelte/internal"],
    // name: "sesm",
    // resolve: {
    //   input: [".svelte"],
    //   output: [".js", ".css"],
    // },
    // async load({ contents, filePath }) {
    async build({ contents, filePath }) {
      const fileContents = await fs.readFile(filePath, "utf-8");
      let codeToCompile = fileContents;
      // PRE-PROCESS
      if (preprocessOptions) {
        codeToCompile = (
          await svelte.preprocess(codeToCompile, preprocessOptions, {
            filename: filePath,
          })
        ).code;
      }
      // COMPILE
      const { js, css } = svelte.compile(codeToCompile, {
        ...svelteOptions,
        filename: filePath,
      });
      const result = { result: js && js.code };
      if (!svelteOptions.css) {
        result.resources = { css: css && css.code };
      }
      // CREATE HTML FILE FOR PAGE
      if (/_pages/.test(filePath)) {
        console.log({ snowpackConfig });
        // filePath is like '/home/username/my_projects/project-name/src/_pages/index.svelte'
        const browserHtmlFilePath = filePath
          .replace("src/_pages", "build")
          .replace(/.svelte$/, ".html");
        const componentPath = filePath
          .replace(/^.+\/src\/_pages\//, "/_dist_/_pages/")
          .replace(/.svelte$/, ".js");

        await fs.mkdir(path.dirname(browserHtmlFilePath), {
          recursive: true,
        });
        await fs.writeFile(browserHtmlFilePath, outputHtml({ componentPath }));
      }
      // console.log({ contents, filePath });

      // for snowpack <2.7
      return result;

      // for snowpack >2.7
      // return {
      //   ".js": js && js.code,
      //   ".css": css && css.code,
      // };
    },
  };
};
