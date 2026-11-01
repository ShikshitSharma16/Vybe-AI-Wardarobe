import mongoose from 'mongoose';

const garmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    wearCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastWornAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Garment = mongoose.model('Garment', garmentSchema);

export default Garment;
