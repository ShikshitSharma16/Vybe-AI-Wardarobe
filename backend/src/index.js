import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import dns from 'node:dns';
import Garment from './models/Garment.js';
import multer from 'multer';
import cloudinary from './config/cloudinary.js';

// Use Google's DNS for MongoDB Atlas SRV lookups
dns.setServers(['8.8.8.8']);
const app = express();

// Store uploaded images temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const PORT = process.env.PORT || 3000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected successfully!');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};


app.use(express.json());

// Test route to check whether the backend is running.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VYBE backend is running!",
    service: "VYBE API",
  });
});

// Save a clothing item
app.post('/api/garments', async (req, res) => {
  try {
    const { name, category, color, imageUrl } = req.body;

    const garment = await Garment.create({
      name,
      category,
      color,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Garment saved successfully!',
      garment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Unable to save garment',
    });
  }
});

// Get all clothing items
app.get('/api/garments', async (req, res) => {
  try {
    const garments = await Garment.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: garments.length,
      garments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch garments',
    });
  }
});

// Upload a clothing image to Cloudinary
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image',
      });
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'vybe/garments',
            resource_type: 'image',
          },
          (uploadError, result) => {
            if (uploadError) {
              reject(uploadError);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file.buffer);
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully!',
        imageUrl: result.secure_url,
      });
    } catch (error) {
  console.error('Cloudinary upload error:', error);

  return res.status(500).json({
    success: false,
    message: 'Image upload failed',
  });
}
  });
});

app.delete('/api/garments/:id', async (req, res) => {
  try {
    const deletedGarment = await Garment.findByIdAndDelete(req.params.id);

    if (!deletedGarment) {
      return res.status(404).json({
        success: false,
        message: 'Garment not found',
      });
    }

    res.json({
      success: true,
      message: 'Garment deleted successfully!',
    });
  } catch (error) {
    console.error('Delete garment error:', error);

    res.status(400).json({
      success: false,
      message: 'Unable to delete garment',
    });
  }
});

app.get('/api/outfits/recommend', async (req, res) => {
  try {
    const garments = await Garment.find();

    const tops = garments.filter((item) =>
      ['shirt', 't-shirt', 'tshirt', 'top', 'hoodie', 'sweater']
        .includes(item.category.toLowerCase().trim())
    );

    const bottoms = garments.filter((item) =>
      ['jeans', 'pants', 'trousers', 'shorts', 'skirt']
        .includes(item.category.toLowerCase().trim())
    );

    const shoes = garments.filter((item) =>
      ['shoes', 'sneakers', 'boots', 'sandals']
        .includes(item.category.toLowerCase().trim())
    );

    if (tops.length === 0 || bottoms.length === 0) {
      return res.json({
        success: true,
        message: 'Add at least one top and one bottom to get outfit recommendations.',
        outfits: [],
      });
    }

    const outfits = [];

    for (const top of tops) {
      for (const bottom of bottoms) {
        const outfit = {
          title: 'Everyday Outfit',
          top,
          bottom,
          shoes: shoes.length > 0 ? shoes[0] : null,
        };

        outfits.push(outfit);

        if (outfits.length >= 5) break;
      }

      if (outfits.length >= 5) break;
    }

    res.json({
      success: true,
      count: outfits.length,
      outfits,
    });
  } catch (error) {
    console.error('Outfit recommendation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to generate outfit recommendations',
    });
  }
});

// Handle API routes that do not exist.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Start the backend server.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`VYBE backend running on port ${PORT}`);
  });
};

startServer();