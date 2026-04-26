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
        "ADMIN", "HoD", "DoFA", "ADoFA", "DoFA_OFFICE",
        "REGISTRAR_OFFICE", "CANDIDATE", "REFEREE",
        "ESTABLISHMENT", "LUCS", "ESTATE"
      ),
      allowNull: false,
    },
    department: {
      type:      DataTypes.STRING(150),
      allowNull: true,   // only for HoD
    },
    active: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
    passwordResetToken:  { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    passwordResetExpiry: { type: DataTypes.DATE,        allowNull: true, defaultValue: null },
  },
  {
  tableName: "users",
  hooks: {
    // Always hash on new user creation — no changed() check needed
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    // Only hash on update if password was actually changed
    beforeUpdate: async (user) => {
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