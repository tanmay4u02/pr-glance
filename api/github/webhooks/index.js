// Node Middlewarr for Cloud Function
const { createNodeMiddleware, createProbot } = require("probot");

const app = require("../../../src/index");

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: "/api/github/webhooks",
});
