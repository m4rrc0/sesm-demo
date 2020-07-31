const liveServer = require("live-server");

async function startLiveServer() {
  var params = {
    // host: '100.115.92.205', // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    root: "build", // Set root directory that's being served. Defaults to cwd.
    file: "404.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
    port: 8081, // Set the server port. Defaults to 8080.
    reload: true,
    open: true, // When false, it won't load your browser by default.

    // ignore: 'scss,my/templates', // comma-separated string for paths to ignore
    // wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
    // mount: [['/components', './node_modules']], // Mount a directory to a route.
    // logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
    // middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
  };
  liveServer.start(params);
  // console.info(`Server running on port ${params.port}`)
}

startLiveServer();
