const { ActivityLog } = require("../models");

/**
 * Log any action to the audit trail.
 * Call this from any controller after a significant action.
 *
 * @param {object} opts
 * @param {object} opts.user      - req.user (can be null for public actions)
 * @param {string} opts.action    - e.g. "CANDIDATE_SELECTED", "OFFER_LETTER_UPLOADED"
 * @param {string} opts.entity    - table/model name e.g. "OnboardingRecord", "Candidate"
 * @param {string} opts.entityId  - the record's id
 * @param {string} opts.description - human-readable detail
 * @param {object} opts.req       - Express req object (for IP)
 */
exports.log = async ({ user, action, entity, entityId, description, req }) => {
  try {
    if (!ActivityLog) {
      // Still don't crash the request, but now you'll see this in logs
      console.error(`activityLogger.log() skipped — ActivityLog model not registered. action=${action}`);
      return;
    }
    await ActivityLog.create({
      userId:      user?.id      || null,
      userRole:    user?.role    || null,
      userEmail:   user?.email   || null,
      action,
      entity:      entity        || null,
      entityId:    entityId      ? String(entityId) : null,
      description: description   || null,
      ipAddress:   req?.ip       || req?.headers?.["x-forwarded-for"] || null,
    });
  } catch (err) {
    // Never crash the main flow due to logging failure
    console.error("ActivityLog error:", err.message,"| action",action);
  }
};
