const { RecruitmentCycle } = require("../models");

async function getCurrentCycle(hodId) {
  return await RecruitmentCycle.findOne({
    where: { hodId },
    order: [["createdAt", "DESC"]],
  });
}

module.exports = getCurrentCycle;