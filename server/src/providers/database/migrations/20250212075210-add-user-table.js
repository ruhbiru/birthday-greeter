"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = {
      entityId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      createdDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      editedDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    };

    await queryInterface.createTable("users", schema);
    await queryInterface.addConstraint("users", {
      fields: ["entityId"],
      type: "unique",
      name: "identity_unique",
    });
  },

  down(queryInterface) {
    return queryInterface.dropTable("users");
  },
};
