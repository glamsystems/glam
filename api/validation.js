const { base58 } = require("@scure/base");

const validatePubkey = (pubkey) => {
  if (pubkey.length > 50) {
    return false;
  }
  let key;
  try {
    key = base58.decode(pubkey);
    if (key.length != 32) {
      return false;
    }
  } catch (_e) {
    return false;
  }
  return key;
};

module.exports = { validatePubkey };
