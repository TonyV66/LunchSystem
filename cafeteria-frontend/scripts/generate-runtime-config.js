const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    let key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const frontendRoot = path.join(__dirname, "..");
const env = loadEnv(path.join(frontendRoot, ".env"));
const currentDate = env.REACT_APP_CURRENT_DATE?.trim();
const content = `window.__CAFETERIA_CONFIG__ = ${JSON.stringify({
  currentDate: currentDate || null,
})};\n`;

const outputPaths = [
  path.join(frontendRoot, "public/runtime-config.js"),
  path.join(frontendRoot, "build/runtime-config.js"),
];

for (const outputPath of outputPaths) {
  if (outputPath.includes(`${path.sep}build${path.sep}`)) {
    const buildDir = path.dirname(outputPath);
    if (!fs.existsSync(buildDir)) {
      continue;
    }
  }

  fs.writeFileSync(outputPath, content);
}

if (currentDate) {
  console.log(`Generated runtime-config.js with currentDate=${currentDate}`);
} else {
  console.log("Generated runtime-config.js with no current date override");
}
