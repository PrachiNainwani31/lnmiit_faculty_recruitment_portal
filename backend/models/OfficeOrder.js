// models/OfficeOrder.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OfficeOrder = sequelize.define(
  "OfficeOrder",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.STRING(100), allowNull: false },
    orderDate:   { type: DataTypes.DATEONLY,    allowNull: false },
    pdfPath:     { type: DataTypes.STRING(500), allowNull: false },
    cycle:       { type: DataTypes.STRING(20),  allowNull: false },
    uploadedById:{ type: DataTypes.INTEGER.UNSIGNED },  // FK → User
    locked:      { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "office_orders" }
);

module.exports = OfficeOrder;