// const sveltePreprocess = require("svelte-preprocess");

// const preprocess = sveltePreprocess({
//   postcss: {
//     plugins: [require("tailwindcss"), require("autoprefixer")],
//   },
// });

module.exports = {
  css: false, // this is the default option in the snowpack svelte plugin but I prefer to be explicit
  hydratable: true,
  //   preprocess,
};
