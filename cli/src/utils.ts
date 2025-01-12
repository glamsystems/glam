import fs from "fs";

export const setStateToConfig = (statePda, path) => {
  const config = fs.readFileSync(path, "utf8");
  const updated = { ...JSON.parse(config), glam_state: statePda };
  fs.writeFileSync(path, JSON.stringify(updated, null, 2), "utf8");
};
