import { DataTypes } from 'sequelize';
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

const initUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Add other user fields as needed
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  // Class methods
  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });
  };

  // Instance methods
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password; // Never return password hash
    delete values.deletedAt;
    return values;
  };

  // Set up associations
  User.associate = function(models) {
    User.hasMany(models.Document, {
      foreignKey: 'user_id',
      as: 'documents',
    });
  };

  return User;
};

export default initUserModel;
