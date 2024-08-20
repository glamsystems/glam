import fs from "fs";

export const setFundToConfig = (fund, path) => {
  const config = fs.readFileSync(path, "utf8");
  const updatedConfig = { ...JSON.parse(config), fund };
  fs.writeFileSync(path, JSON.stringify(updatedConfig, null, 2), "utf8");
};
