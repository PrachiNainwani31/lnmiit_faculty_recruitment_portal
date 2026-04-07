const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:        { type: DataTypes.STRING(20), allowNull: false },
    role: {
      type: DataTypes.ENUM(
        "HOD","DOFA","ADMIN","ADOFA","DOFA_OFFICE",
        "ESTABLISHMENT","LUCS","ESTATE","REGISTRAR_OFFICE","CANDIDATE"
      ),
      allowNull: false,
    },
    // ✅ NEW: target a specific user (e.g. a specific HOD or candidate)
    targetUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    title:   { type: DataTypes.STRING(300), allowNull: false },
    message: { type: DataTypes.TEXT,        allowNull: false },
    type: {
      type: DataTypes.ENUM("STATUS","COMMENT","UPLOAD","SYSTEM"),
      defaultValue: "SYSTEM",
    },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "notifications" }
);

module.exports = Notification;