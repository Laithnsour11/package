import { DataTypes } from 'sequelize';
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

const initDocumentModel = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.JSONB, // Store vector as JSONB array
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('file_upload', 'text_input', 'video'),
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_type',
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'original_name',
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mime_type',
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'video_url',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
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
    tableName: 'documents',
    timestamps: true,
    underscored: true,
  });

  // Class methods
  Document.findByUserId = async function(userId) {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  };

  // Instance methods
  Document.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
  };

  // Set up associations
  Document.associate = function(models) {
    Document.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Document;
};

export default initDocumentModel;
