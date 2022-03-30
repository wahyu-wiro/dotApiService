"use strict";
require('dotenv').config();
var fs = require("fs"),
  path = require("path"),
  mongoose = require('mongoose').set('debug', true),
  mongoConf = require('./config/mongo.js'),
  bodyParser = require('body-parser');
// http = require("http");

var app = require("restana")();
var helmet = require("helmet");
var swaggerTools = require("swagger-tools");
var jsyaml = require("js-yaml");
var serverPort = process.env.APP_PORT;
// swaggerRouter configuration
var options = {
  swaggerUi: path.join(__dirname, "/swagger.json"),
  controllers: path.join(__dirname, "./controllers"),
  useStubs: process.env.NODE_ENV === "development", // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname, "api/swagger.yaml"), "utf8");
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, async function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  app.use(
    bodyParser.json({
      limit: "5MB",
    })
  );
  // app.use(
  //   bodyParser.json({
  //     limit: 10000 * 10000 * 20,
  //     type: 'application/json'
  //   })
  // );
  app.use(helmet());

  app.use(
    bodyParser.urlencoded({
      limit: "5MB",
      extended: true,
      parameterLimit: 50000,
    })
  );
  // app.use(
  //   bodyParser.urlencoded({
  //     extended: true,
  //     limit: 10000 * 10000 * 20,
  //     type: 'application/x-www-form-urlencoded'
  //   })
  // );

  app.start(serverPort, "0.0.0.0").then((server) => {
    console.log('Server running on port', serverPort)
  });

  // mongoose.connect(mongoConf.mongoDb.url, {
  //   useUnifiedTopology: true
  // }).then(function (e) {
  //   console.log("MONGO CONNECTED");
  // });
  // http.createServer(app).listen(serverPort, function () {
  //   console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
  //   console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  // });
});

// const CronJob = require('cron').CronJob;
// const configService = require('./config/configService');

// let job1 = new CronJob('0 */1 * * * *', async function() {
//   configService.getConfig();
// }, null, true, 'Asia/Jakarta'); 
// job1.start();

// let job2 = new CronJob('*/10 * * * * *', async function() {
//   // console.log("result::", await configService.getHostname('backend'));
// }, null, true, 'Asia/Jakarta'); 
// job2.start();