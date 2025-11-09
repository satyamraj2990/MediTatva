const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  genericName: { 
    type: String,
    trim: true 
  },
  brand: { 
    type: String,
    trim: true 
  },
  dosage: String,
  form: { 
    type: String, 
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other'],
    default: 'tablet'
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  requiresPrescription: { 
    type: Boolean, 
    default: false 
  },
  description: String,
  manufacturer: String,
  category: String,
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Index for faster searches
MedicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });

module.exports = mongoose.model('Medicine', MedicineSchema);
