const crypto = require("crypto");

/**
 * Generates a secure random password meeting complexity rules:
 * - Min 8 chars
 * - At least 1 uppercase, 1 lowercase, 1 digit, 1 special char
 */
exports.generatePassword = () => {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "@#$%!&*";
  const all     = upper + lower + digits + special;

  const rand = (str) => str[crypto.randomInt(str.length)];

  // Guarantee at least one of each required type
  const required = [rand(upper), rand(lower), rand(digits), rand(special)];

  // Fill remaining 4 chars from full set
  const rest = Array.from({ length: 4 }, () => rand(all));

  // Shuffle
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join("");
};

/** Generate a secure random reset token */
exports.generateResetToken = () => crypto.randomBytes(32).toString("hex");