const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize){
    return super.init({
      name: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      age:{
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      married:{
        type: Sequelize.BOOLEAN, 
        allowNull: false,
      },
      comment:{
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    }, {
      sequelize, 
      timestamps: true,
      underscored: false,
      paranoid: true,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Comment, { foreignKey: 'commenter', sourceKey: 'id'})
  }
}