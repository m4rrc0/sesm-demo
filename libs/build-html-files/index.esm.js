import { promises as fs, existsSync } from "fs";
import * as glob from "glob";
import * as path from "path";

import slugify from "./slugify";
import snowpackConfig from "../../snowpack.config.js";

const {
  browserConfig: { devOptions: { out: browserDir = "build" } = {} } = {},
  ssrConfig: { devOptions: { out: ssrDir = "build-temp" } = {} } = {},
} = snowpackConfig || {};
const pagesDir = "_pages";

// const isPage = (destPath) => {
//   // destPath is like "dist/_pages/tests/spa/index.js"
//   const isAutoRoute = /^dist\/_pages\//.test(destPath);

//   const component = destPath.replace("dist/", "");
//   const isProgrammaticRoute =
//     programmaticRoutes.filter(({ component: prComp }) => prComp === component)
//       .length > 0;

//   return isAutoRoute || isProgrammaticRoute;
// };

const makePageDef = (ssrPath) => {
  // browserPath is the path to the browser version of the js file
  const browserPath = ssrPath.replace(`${ssrDir}/`, `${browserDir}/`);
  // relativePath is the path to the js file when the site is hosted / the base directory is 'browserDir'
  const relativePath = browserPath.replace(`${browserDir}/`, "");
  const relPathSplit = relativePath.split("/");
  // name is the name of the js file or the parent dir if the js file is called 'index', hence the name of the html page
  const tempName = relPathSplit[relPathSplit.length - 1].replace(/.js$/, "");
  // if the file is at the root of the pagesDir (and only then), keep 'index' as name
  const name =
    tempName === "index" && relPathSplit.length > 3
      ? relPathSplit[relPathSplit.length - 2]
      : tempName;
  // relativeHtmlPath is the path to the html page (has to be placed at the root, out of the '_dist_/_pages/' directory)
  const relativeHtmlPath = slugify(
    relativePath.replace(/^_dist_\/_pages/, "").replace(/.js$/, ""),
    { keepSlashes: true }
  );

  // all pages are 'index.html' inside the appropriate folder
  const relativeHtmlFilePath =
    tempName === "index" ? relativeHtmlPath : `${relativeHtmlPath}/index`;
  // avoid double slashes in case path is '/' for example
  const browserHtmlFilePath = `${browserDir}${relativeHtmlFilePath}.html`.replace(
    /\/\/+/,
    "/"
  );

  const importPath = /.js$/.test(relativePath)
    ? relativePath
    : `${relativePath}.js`;

  // console.log({
  //   ssrPath,
  //   browserPath,
  //   relativePath,
  //   importPath,
  //   relativeHtmlPath,
  //   relativeHtmlFilePath,
  //   browserHtmlFilePath,
  //   name,
  //   props: {},
  // });

  return {
    ssrPath,
    browserPath,
    relativePath,
    importPath,
    relativeHtmlPath,
    relativeHtmlFilePath,
    browserHtmlFilePath,
    name,
    props: {},
  };
};

async function compileHtml(pageDef /*, options */) {
  // console.log({ pageDef });
  const {
    ssrPath,
    browserPath,
    relativePath,
    importPath,
    relativeHtmlPath,
    relativeHtmlFilePath,
    browserHtmlFilePath,
    name,
    props: propsInit,
    options: { noJS } = {},
  } = pageDef;
  const props = { url: relativeHtmlPath, propsInit };
  if (!relativeHtmlPath || !relativePath) {
    console.error(
      `unable to create HTML for page "${name}" because it is lacking relativeHtmlPath or relativePath. pageDef is`,
      pageDef
    );
    return;
  }
  // TODO: don't load JS if it is an individual page (not SPA) and there are no side effects in this page
  // IDEA: check the content of the JS output of Comp.render to see if there are dom events or onMount svelte method or things like that
  // IDEA: explicitely set a comment in our svelte component to be found here?
  // if (/no-js/.test(html)) {
  //   console.log(html);
  // }

  try {
    const Comp = require(path.join(process.cwd(), ssrPath)).default;

    const { head, html, css } = Comp.render({
      ...props,
    });

    // console.log({ css });

    let outputHtml = `
<!DOCTYPE html>
  <html lang="en">
  <head>
    ${head}
    <link rel="stylesheet" type="text/css" href="/global.css">
    <style>${css && css.code}</style>
  </head>
  <body>
    <div id="app">${html}</div>
    ${
      !noJS
        ? `<script type="module">
      import Comp from '/${importPath}';
      new Comp({
          target: document.querySelector('#app'),
          hydrate: true,
          props: ${props && JSON.stringify(props)}
      });
    </script>`
        : ""
    }
  </body>
</html>
    `;

    // Minify HTML files with html-minifier if in production.
    // if (shouldMinify) {
    //   outputHtml = await minifyHtml({ html: outputHtml });
    // }

    await fs.mkdir(path.dirname(browserHtmlFilePath), { recursive: true });
    await fs.writeFile(browserHtmlFilePath, outputHtml);

    console.info(`Compiled HTML ${browserHtmlFilePath}`);

    return { browserHtmlFilePath };
  } catch (err) {
    console.log("");
    console.error(`Failed to compile page: ${browserHtmlFilePath}`);
    console.error(err);
    console.log("");
    process.exit(1);
    return { browserHtmlFilePath };
  }
}

async function initialBuild() {
  const globConfig = { nodir: true };
  const ssrFiles = glob.sync(
    `${ssrDir}/_dist_/**/!(*+(spec|test)).+(js|mjs)`,
    globConfig
  );
  const jsAutomaticPagesPaths = glob.sync(
    `${ssrDir}/_dist_/_pages/**/!(*+(spec|test)).+(js|mjs)`,
    globConfig
  );
  let programmaticPages = []; // TODO:
  try {
    programmaticPages =
      require(path.join(process.cwd(), "/src/routes.js")).default || [];
  } catch {
    console.info("no /src/routes.js file defined for programmatic page");
  }

  // create pageDef
  const jsAutomaticPages = jsAutomaticPagesPaths.map((ssrPath) => {
    // ssrPath is like 'build-temp/_dist_/_pages/about/index.js
    const pageDef = makePageDef(ssrPath);
    return pageDef;
  });

  // Modify js files to properly import from the 'build-temp' folder
  // TODO: account for other imports as well, not only web_modules ?
  await Promise.all(
    ssrFiles.map(async (ssrPath) => {
      // ssrPath is like 'build-temp/_dist_/_pages/index.js
      const absolutePath = path.join(process.cwd(), "/build/web_modules");
      const content = await fs.readFile(ssrPath, "utf-8");
      const result = content.replace(
        /from "\/web_modules/g,
        `from "${absolutePath}`
      );

      await fs.writeFile(ssrPath, result, "utf-8");
    })
  );

  // console.log({ jsAutomaticPages });

  const pages = await Promise.all(
    jsAutomaticPages.map(async (pageDef) => {
      await compileHtml(pageDef);
    })
  );
}

async function main() {
  await initialBuild();

  console.log({ snowpackConfig });
}

main();
