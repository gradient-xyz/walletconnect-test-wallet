"use strict";
exports.__esModule = true;
var awsServerlessExpress = require("aws-serverless-express");
var app = require("./app");
/**
 * @type {import('http').Server}
 */
var server = awsServerlessExpress.createServer(app);
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = function (event, context) {
    console.log("EVENT: " + JSON.stringify(event));
    return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};
