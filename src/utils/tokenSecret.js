import crypto from "crypto";

function generateTokenSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

export { generateTokenSecret };
