const Generated = require("@noqcks/generated");
const utils = require("./utils");

function getPullRequest(ctx) {
  return ctx.payload.pull_request;
}

function changedFiles(ctx) {
  return ctx.payload.pull_request.changed_files;
}

function isPublicRepo(ctx) {
  const { repository } = ctx.payload;
  return !repository.private;
}

async function getCustomGeneratedFiles(ctx, owner, repo) {
  const files = [];
  const path = ".gitattributes";

  let response;
  try {
    response = await ctx.octokit.repos.getContent({ owner, repo, path });
    const buff = Buffer.from(response.data.content, "base64");
    const lines = buff.toString("ascii").split("\n");

    lines.forEach((item) => {
      if (item.includes("linguist-generated=true")) {
        files.push(item.split(" ")[0]);
      }
    });
    return files;
  } catch (e) {
    return files;
  }
}

async function listPullRequestFiles(ctx, owner, repo, number) {
  return ctx.octokit.paginate(ctx.octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });
}

async function getFileContent(ctx, owner, repo, filename, ref) {
  let response;
  try {
    response = await ctx.octokit.repos.getContent({
      owner,
      repo,
      path: filename,
      ref,
    });
    const buff = Buffer.from(response.data.content, "base64");
    return buff.toString("ascii");
  } catch (e) {
    return "";
  }
}

async function getAdditionsAndDeletions(ctx) {
  const { number } = ctx.payload.pull_request;
  const {
    owner: { login: owner },
    name: repo,
  } = ctx.payload.pull_request.base.repo;
  let { additions, deletions } = ctx.payload.pull_request;

  // grab all pages for files modified in the pull request
  const files = await listPullRequestFiles(ctx, owner, repo, number);

  // get list of custom generated files as defined in .gitattributes
  const customGeneratedFiles = await getCustomGeneratedFiles(ctx, owner, repo);

  const commitSha = ctx.payload.pull_request.head.sha;

  await Promise.all(
    files.map(async (file) => {
      let fileContent = file.patch || "";
      // for private repos we can only use the file name to determine if it is generated
      // file, since we don't ask for file content read permissions in the app.
      if (isPublicRepo(ctx)) {
        fileContent = await getFileContent(
          ctx,
          owner,
          repo,
          file.filename,
          commitSha
        );
      }
      const g = new Generated(file.filename, fileContent);
      // if files are generated, remove them from the additions/deletions total
      if (
        utils.globMatch(file.filename, customGeneratedFiles) ||
        g.isGenerated()
      ) {
        additions -= file.additions;
        deletions -= file.deletions;
      }
    })
  );
  return [additions, deletions];
}

async function removeExistingLabels(ctx, label, customLabels) {
  ctx.payload.pull_request.labels.forEach((prLabel) => {
    const labelNames = Object.keys(customLabels).map(
      (key) => customLabels[key].name
    );
    if (labelNames.includes(prLabel.name)) {
      if (prLabel.name !== label) {
        ctx.octokit.issues.removeLabel(
          ctx.issue({
            name: prLabel.name,
          })
        );
      }
    }
  });
}

async function ensureLabelExists(ctx, name, color) {
  try {
    return await ctx.octokit.issues.getLabel(
      ctx.repo({
        name,
      })
    );
  } catch (e) {
    return ctx.octokit.issues.createLabel(
      ctx.repo({
        name,
        color,
      })
    );
  }
}

async function addLabel(ctx, name, color) {
  const params = { ...ctx.issue(), labels: [name] };

  await ensureLabelExists(ctx, name, color);
  await ctx.octokit.issues.addLabels(params);
}

module.exports = {
  getPullRequest,
  isPublicRepo,
  changedFiles,
  getAdditionsAndDeletions,
  removeExistingLabels,
  addLabel,
};
