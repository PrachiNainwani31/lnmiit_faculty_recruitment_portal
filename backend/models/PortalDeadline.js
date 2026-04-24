const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PortalDeadline = sequelize.define("PortalDeadline", {
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  cycle:            { type: DataTypes.STRING(20), allowNull: false },
  hodId:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  deadlineAt:       { type: DataTypes.DATE, allowNull: false },
  createdById:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  extendedAt:       { type: DataTypes.DATE, allowNull: true },
  extendedById:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  previousDeadline: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "portal_deadlines" });

module.exports = PortalDeadline;