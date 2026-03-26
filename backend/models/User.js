// models/User.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    name: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      unique:    true,
      set(val) { this.setDataValue("email", val.toLowerCase().trim()); },
    },
    password: {
      type:      DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type:      DataTypes.ENUM(
        "ADMIN", "HOD", "DOFA", "ADOFA", "DOFA_OFFICE",
        "TRAVEL", "CANDIDATE", "REFEREE", "DIRECTOR",
        "ESTABLISHMENT", "LUCS", "ESTATE"
      ),
      allowNull: false,
    },
    department: {
      type:      DataTypes.STRING(150),
      allowNull: true,   // only for HOD
    },
    active: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Instance method — compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;