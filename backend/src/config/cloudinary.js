import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

export const validateCloudinaryConfig = () => {
  const requiredVariables = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  for (const variable of requiredVariables) {
    console.log(
      `[Cloudinary config] ${variable}: ${
        process.env[variable] ? 'present' : 'missing'
      }`
    );
  }

  return missingVariables;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
