export default [
  //   {
  //     path: '/tests/spa/one/',
  //     name: 'SPA: Test one',
  //     component: '_pages/tests/spa/index',
  //     props: {
  //       // url: "/tests/spa/one/" // automatically taken from path
  //     },
  //   },
  //   {
  //     path: '/tests/spa/',
  //     name: 'SPA: Page index',
  //     component: '_pages/tests/spa/index',
  //   },
  {
    path: '/',
    name: 'index',
    component: '_pages/index',
    props: { MainTitle: { altAltColor: 'yellow' } },
    //   options: { noJS: true },
  },
  {
    path: '/tests/',
    name: 'Tests',
    component: 'pages/tests/index',
    props: { color: 'pink' },
    //   options: { noJS: true },
  },
];
