'use strict';
module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    time: DataTypes.DATE
  }, {});
  Log.associate = function(models) {
    // associations can be defined here
  };
  return Log;
};