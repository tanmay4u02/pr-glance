const context = require("./context");
const labels = require("./config/labels");
const MAX_FILES = 1000;

module.exports = async (ctx) => {
  if (context.changedFiles(ctx) > MAX_FILES) {
    return;
  }

  const [additions, deletions] = await context.getAdditionsAndDeletions(ctx);

  let customLabels;
  try {
    // custom labels stored in .github/labels.yml
    customLabels = await ctx.config("labels.yml", labels.labels);
  } catch (err) {
    // catch error if the user hasn't granted permissions to this file yet
    customLabels = labels.labels;
  }

  const [labelColor, label] = labels.generateSizeLabel(
    additions + deletions,
    customLabels
  );

  // remove any existing size label if it exists and is not the label to add
  await context.removeExistingLabels(ctx, label, customLabels);

  // assign GitHub label
  await context.addLabel(ctx, label, labelColor);
};
