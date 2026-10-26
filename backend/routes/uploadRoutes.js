import express from 'express';
import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Memory storage to stream buffer to Supabase Storage
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const filetypes = /jpe?g|png|webp|gif/;
  const mimetypes = /image\/(jpe?g|png|webp|gif)/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Images only (jpeg, png, webp, gif)!'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload product image or generic image
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const bucketName = req.query.bucket === 'avatars' ? 'avatars' : 'product-images';
  const prefix = req.query.bucket === 'avatars' ? 'avatars' : 'products';

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    return res.status(500).json({ message: 'Upload failed: ' + error.message });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  res.status(200).json({
    message: 'Image uploaded successfully',
    image: urlData.publicUrl,
    url: urlData.publicUrl,
  });
});

// Upload avatar specifically
router.post('/avatar', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('avatars')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    return res.status(500).json({ message: 'Avatar upload failed: ' + error.message });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(data.path);

  res.status(200).json({
    message: 'Avatar uploaded successfully',
    image: urlData.publicUrl,
    url: urlData.publicUrl,
  });
});

export default router;
