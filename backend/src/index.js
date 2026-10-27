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
      console.error('Cloudinary upload failed:', error.message);

      res.status(500).json({
        success: false,
        message: 'Image upload failed',
      });
    }
  });
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