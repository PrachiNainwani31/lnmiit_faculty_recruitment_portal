// models/Expert.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Expert = sequelize.define(
  "Expert",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:          { type: DataTypes.STRING(20),  allowNull: false },
    fullName:       { type: DataTypes.STRING(200), allowNull: false },
    email: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      set(val) { this.setDataValue("email", val.toLowerCase().trim()); },
    },
    designation:    { type: DataTypes.STRING(200), allowNull: false },
    department:     { type: DataTypes.STRING(150), allowNull: false },
    institute:      { type: DataTypes.STRING(300), allowNull: false },
    specialization: { type: DataTypes.STRING(200) },
    phone:          { type: DataTypes.STRING(30) },
    uploadedById:   { type: DataTypes.INTEGER.UNSIGNED },  // FK → User
  },
  {
    tableName: "experts",
    indexes: [
      {
        unique: true,
        fields: ["email", "cycle", "uploadedById"],
        name:   "uq_expert_email_cycle_uploader",
      },
    ],
  }
);

module.exports = Expert;