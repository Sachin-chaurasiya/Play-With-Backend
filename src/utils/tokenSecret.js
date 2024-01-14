import crypto from "crypto";

/**
 * @description Generates a random token secret
 * @param {*} length
 * @returns  {string}
 */
function generateTokenSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

export { generateTokenSecret };
