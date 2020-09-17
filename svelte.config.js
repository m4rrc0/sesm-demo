// const sveltePreprocess = require("svelte-preprocess");

// const preprocess = sveltePreprocess({
//   postcss: {
//     plugins: [require("tailwindcss"), require("autoprefixer")],
//   },
// });

const fs = require('fs');
const path = require('path');
var crypto = require('crypto');

const snowpackConfig = require('./snowpack.config.js').default;
const {
  browserConfig: { devOptions: { out: browserDir = 'build' } = {} } = {},
  ssrConfig: { devOptions: { out: ssrDir = 'build-temp' } = {} } = {},
} = snowpackConfig || {};
const pagesDir = '_pages';

const componentsInfosPath = `${ssrDir}/components-infos.json`;

function generateChecksum(str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}
// function hashCode(s) {
//   let h;
//   for (let i = 0; i < s.length; i++)
//     h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

//   return h;
// }

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
// function hashFnv32a(str, asString, seed) {
//   /*jshint bitwise:false */
//   var i,
//     l,
//     hval = seed === undefined ? 0x811c9dc5 : seed;

//   for (i = 0, l = str.length; i < l; i++) {
//     hval ^= str.charCodeAt(i);
//     hval +=
//       (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
//   }
//   if (asString) {
//     // Convert to 8 digit hex string
//     return ('0000000' + (hval >>> 0).toString(16)).substr(-8);
//   }
//   return hval >>> 0;
// }

module.exports = {
  css: false, // this is the default option in the snowpack svelte plugin but let's be explicit
  hydratable: true,
  preprocess: [
    {
      markup: ({ content, filename }) => {
        if (process.env.BUILD_STEP === 'browser') return null;

        // determine component name from filename
        const compNameArr = filename
          .replace(/\.(?:svelte|md)$/, '')
          .replace(/\.h$/, '')
          .replace(/\/index$/, '')
          .split('/');
        let compName = compNameArr[compNameArr.length - 1];
        compName = compName === pagesDir ? 'index' : compName;

        const childrenComponents = [];

        // check if the component should be hydrated
        // TODO: find a more robust way. For now, we simply look for `let` in the script

        // 1. isolate the script part
        const markupScript = content.match(/<script[\S\s]+<\/script>/);

        // 2. look for `let` not preceded by `export`: /(?<!export )(let)/
        const shouldBeHydrated =
          !!markupScript && markupScript[0].search(/(?<!export )(let)/) > -1;

        // 3. a parent component should inject an `hId` into every child component
        let newContent = content
          // we recognize components because they should start with an uppercase letter
          .replace(/<(?!(?:script|style|[a-z0-9]+)\b)\b\w+/g, (...match) => {
            // match[0] is like `<CompName`
            // match[0].substring(1) is the CompName
            const childCompName = match[0].substring(1);
            const hid = `${childCompName}-${match[1]}`;
            childrenComponents.push({ name: childCompName, hid });
            // match[1] is the position where the match was found
            return `${match[0]} hid="${hid}"`;
          });

        // 4. a child component will receive an `hId` prop that it should `export let`
        newContent = !shouldBeHydrated
          ? newContent
          : newContent
              .replace(/(<script.*>)/g, (...match) => {
                return `${match[0]}\nexport let hid;`;
              })
              // 5. if the current component should be hydrated, inject the hId in the top markup component
              .replace(/<(?!(?:script|style)\b)\b\w+/, (...match) => {
                return `${match[0]} data-hid={hid}`;
              });

        // Persist components infos in a JSON file in `build-temp/components-infos.json`
        const srcPath = filename
          .replace(`${process.cwd()}/src`, '')
          .replace(/.svelte$/, '')
          .replace(/.h$/, '');
        const componentsInfos = {
          filename,
          srcPath,
          name: compName,
          shouldBeHydrated,
          // isPage: null,
          // hash: hashFnv32a(content, true),
          checksum: generateChecksum(content),
          children: childrenComponents,
        };

        if (!fs.existsSync(componentsInfosPath)) {
          fs.mkdirSync(path.dirname(componentsInfosPath), {
            recursive: true,
          });
          fs.writeFileSync(componentsInfosPath, '{}');
        }

        let fileComponentsInfo = fs.readFileSync(componentsInfosPath, 'utf-8');
        fileComponentsInfo =
          fileComponentsInfo && JSON.parse(fileComponentsInfo);

        fs.writeFileSync(
          componentsInfosPath,
          JSON.stringify({
            ...fileComponentsInfo,
            [srcPath]: componentsInfos,
          })
        );

        return {
          code: newContent,
          // , map, dependencies
        };
      },
    },
  ],
};
