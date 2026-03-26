// models/Notification.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:   { type: DataTypes.STRING(20),   allowNull: false },
    role:    { type: DataTypes.ENUM("HOD", "DOFA", "ADMIN"), allowNull: false },
    title:   { type: DataTypes.STRING(300),  allowNull: false },
    message: { type: DataTypes.TEXT,         allowNull: false },
    type: {
      type: DataTypes.ENUM("STATUS", "COMMENT", "UPLOAD", "SYSTEM"),
      defaultValue: "SYSTEM",
    },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "notifications" }
);

module.exports = Notification;