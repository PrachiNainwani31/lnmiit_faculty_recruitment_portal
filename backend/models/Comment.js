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
  },
  { tableName: "comments" }
);

module.exports = Comment;