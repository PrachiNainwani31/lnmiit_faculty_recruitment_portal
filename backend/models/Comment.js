// models/Comment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comment = sequelize.define(
  "Comment",
  {
    id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:    { type: DataTypes.STRING(20),  allowNull: false },
    fromRole: { type: DataTypes.STRING(50),  allowNull: false },
    toRole:   { type: DataTypes.STRING(50),  allowNull: false },
    message:  { type: DataTypes.TEXT,        allowNull: false },
    fromDepartment: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    targetUserId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: true, 
      defaultValue: null 
    },
  },
  { tableName: "comments" }
);

module.exports = Comment;