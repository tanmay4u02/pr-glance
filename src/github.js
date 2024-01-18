const context = require("./context");
const utils = require("./utils");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit();

function isDescrAndPreviewWanted(ctx, app) {
  const { commits_url, comments_url, title, body } =
    context.getPullRequest(ctx);

  return Promise.all([fetch(commits_url), fetch(comments_url)])
    .then((responses) =>
      Promise.all(responses.map((response) => response.json()))
    )
    .then(([commits, comments]) => {
      const commitMsgs = commits.map((elem) => elem.commit.message);
      const commentMsgs = comments.map((elem) => elem.body);

      return utils.isPresent_glance_cmd([
        title,
        body,
        ...commitMsgs,
        ...commentMsgs,
      ]);
    });
}

function getRepoAndPRDetails(ctx) {
  return ({
    number: pull_number,
    base: {
      repo: {
        name: repo,
        owner: { login: owner },
      },
    },
    head: { ref: branch_name },
  } = context.getPullRequest(ctx));
}

function generateCodesandboxPreviewLink(ctx) {
  getRepoAndPRDetails(ctx);

  return `https://codesandbox.io/s/github/${owner}/${repo}/tree/${branch_name}`;
}

const getCodeDiffInPR = async (ctx) => {
  getRepoAndPRDetails(ctx);

  return octokit.pulls
    .get({
      owner,
      repo,
      pull_number,
      mediaType: {
        format: "diff",
      },
    })
    .then(({ data: diff }) => diff);
};

const generateComment = async (ctx) => {
  const diff = await getCodeDiffInPR(ctx);
  const prDescr = diff ? await utils.getOpenAi_PR_explanation(diff) : "";

  return ctx.issue({
    body:
      prDescr +
      `\n### Codesandbox preview link:
- ${generateCodesandboxPreviewLink(ctx)}`,
  });
};

module.exports = {
  isDescrAndPreviewWanted,
  generateCodesandboxPreviewLink,
  getCodeDiffInPR,
  generateComment,
};
