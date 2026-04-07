const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define("ActivityLog", {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  userRole:    { type: DataTypes.STRING(50),        allowNull: true },
  userEmail:   { type: DataTypes.STRING(255),       allowNull: true },
  action:      { type: DataTypes.STRING(100),       allowNull: false },
  entity:      { type: DataTypes.STRING(100),       allowNull: true },
  entityId:    { type: DataTypes.STRING(100),       allowNull: true },
  description: { type: DataTypes.TEXT,              allowNull: true },
  ipAddress:   { type: DataTypes.STRING(50),        allowNull: true },
}, { tableName: "activity_logs", updatedAt: false });

module.exports = ActivityLog;