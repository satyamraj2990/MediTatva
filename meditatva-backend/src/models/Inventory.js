const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  medicine: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Medicine', 
    required: true, 
    unique: true 
  },
  current_stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  reorderLevel: { 
    type: Number, 
    default: 10 
  },
  location: { 
    type: String,
    default: 'Main Store'
  },
  lastRestocked: Date,
  notes: String
}, { 
  timestamps: true 
});

// Index for quick lookups
InventorySchema.index({ medicine: 1 });

// Virtual to check if reorder needed
InventorySchema.virtual('needsReorder').get(function() {
  return this.current_stock <= this.reorderLevel;
});

module.exports = mongoose.model('Inventory', InventorySchema);
