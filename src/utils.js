const { Octokit } = require("@octokit/rest");
const { openai } = require("./config/openai");
const minimatch = require("minimatch");

const octokit = new Octokit();

const isPresent_glance_cmd = (strings) =>
  strings.some((str) => str?.includes("/glance"));

const getCodeDiffInPR = async ({ owner, repo, pull_number }) => {
  const { data: diff } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: {
      format: "diff",
    },
  });

  return diff;
};

const getOpenAi_PR_explanation = async (diff) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Clearly explain the focus of this PR in less than 200 characters. Then write "\n\n### Detailed summary\n" followed by all notable changes formatted as a bullet list. Be specific and concise. 
        Here is the code diff: ${diff}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  return chatCompletion["choices"][0]["message"]["content"];
};

function globMatch(file, globs) {
  for (let i = 0; i < globs.length; i += 1) {
    if (minimatch(file, globs[i])) {
      return true;
    }
  }
  return false;
}

module.exports = {
  isPresent_glance_cmd,
  getCodeDiffInPR,
  getOpenAi_PR_explanation,
  globMatch,
};
