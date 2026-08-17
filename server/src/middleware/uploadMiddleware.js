const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown', '.csv', '.json', '.log', '.rtf', '.doc', '.docx', '.js', '.ts', '.py', '.html', '.css'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype.startsWith('text/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/json' ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Supported types include PDF, TXT, MD, CSV, JSON, RTF, and code/text files.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max limit
  },
});

module.exports = upload;
