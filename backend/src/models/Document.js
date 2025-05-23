const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    source: {
      type: String,
      enum: ['file_upload', 'text_input', 'video'],
      required: true
    },
    fileType: {
      type: String,
      required: function() {
        return this.metadata.source === 'file_upload';
      }
    },
    size: Number,
    originalName: String,
    mimeType: String,
    videoUrl: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for text search
// documentSchema.index({ content: 'text', title: 'text', tags: 'text' });

// Index for vector search (if using MongoDB Atlas)
// documentSchema.index({ embedding: 'knn_vector' });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
