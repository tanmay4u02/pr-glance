const github = require("./github");
const add_size_label = require("./add_size_label");

module.exports = (app) => {
  app.on(
    [
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.synchronize",
      "pull_request.edited",
      // TODO - run for comment added and edited on PR
      // "issue_comment.created",
      // "issue_comment.edited",
    ],
    async (ctx) => {
      await add_size_label(ctx);

      if (await github.isDescrAndPreviewWanted(ctx)) {
        app.log.info("Generating PR Descr and Preview Comment");

        const prComment = await github.generateComment(ctx);

        ctx.octokit.issues.createComment(prComment);
      }
    }
  );

  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });
};
