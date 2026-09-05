import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      const message = err.message || 'File upload failed';
      const isTypeError = message === 'File type not allowed';
      const isSizeError = message && message.toLowerCase().includes('file too large');
      return res.status(400).json({
        error: {
          code: isSizeError ? 'FILE_TOO_LARGE' : 'INVALID_FILE_TYPE',
          message,
          field: 'file',
          details: {},
        },
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded', field: 'file', details: {} } });
    }
    // Uploads are served by THIS backend (app.use('/uploads', static)).
    // Always build the URL from the request host, not the frontend APP_URL.
    const base = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
    res.json({
      url: `${base}/uploads/${req.file.filename}`,
    });
  });
});

export default router;