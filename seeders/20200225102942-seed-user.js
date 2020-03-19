'use strict';

const bcrypt = require('bcrypt');
module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    let password = 'AbsINThe&FIMTECH2020';
    return queryInterface.bulkInsert('Users', [{
      login: 'clochette',
      password: password,
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    return queryInterface.bulkDelete('Users', null, {});
  }
};
