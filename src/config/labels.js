const labels = {
  XS: {
    name: "size/XS",
    lines: 0,
    color: "3CBF00",
  },
  S: {
    name: "size/S",
    lines: 10,
    color: "5D9801",
  },
  M: {
    name: "size/M",
    lines: 30,
    color: "7F7203",
  },
  L: {
    name: "size/L",
    lines: 100,
    color: "A14C05",
  },
  XL: {
    name: "size/XL",
    lines: 500,
    color: "C32607",
  },
  XXL: {
    name: "size/XXL",
    lines: 1000,
    color: "E50009",
  },
};

function generateSizeLabel(lineCount, l) {
  if (lineCount < l.S.lines) {
    return [l.XS.color, l.XS.name];
  }
  if (lineCount < l.M.lines) {
    return [l.S.color, l.S.name];
  }
  if (lineCount < l.L.lines) {
    return [l.M.color, l.M.name];
  }
  if (lineCount < l.XL.lines) {
    return [l.L.color, l.L.name];
  }
  if (lineCount < l.XXL.lines) {
    return [l.XL.color, l.XL.name];
  }
  return [l.XXL.color, l.XXL.name];
}

module.exports = {
  labels,
  generateSizeLabel,
};
