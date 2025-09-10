import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5001;

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`\n🔥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  // console.log('Headers:', JSON.stringify(req.headers, null, 2)); // Optionally log headers
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// CORS with detailed logging
app.use(cors({
  origin: function(origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    // Allow requests with no origin (like file uploads from Postman, curl)
    if (!origin) return callback(null, true);
    callback(null, true); // Allow all origins for simplicity in development
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- HELPER FUNCTIONS ---
const getMetadataPath = (imagePath) => {
  const parsedPath = path.parse(imagePath);
  return path.join(parsedPath.dir, parsedPath.name + '.json');
};

const saveMetadata = (imagePath, metadata) => {
  const metadataPath = getMetadataPath(imagePath);
  console.log('💾 Saving metadata to:', metadataPath);
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('✅ Metadata saved successfully.');
  } catch (error) {
    console.error('❌ Error saving metadata:', error);
  }
};

const loadMetadata = (imagePath) => {
  const metadataPath = getMetadataPath(imagePath);
  try {
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Error loading metadata:', error);
  }
  return null;
};

// --- FILE STORAGE SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temporary directory for initial upload
    const tempUploadPath = path.join(__dirname, "uploads", "temp");
    console.log('📁 Setting up temporary file destination:', tempUploadPath);
    try {
      fs.mkdirSync(tempUploadPath, { recursive: true });
      console.log('✅ Temp directory created/verified');
      cb(null, tempUploadPath);
    } catch (error) {
      console.error('❌ Error creating temp directory:', error);
      cb(error, null); // Pass error to Multer
    }
  },
  filename: (req, file, cb) => {
    // Use a timestamp for uniqueness, but keep original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:');
    console.log(' - Original name:', file.originalname);
    console.log(' - Mimetype:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ File accepted (image)');
      cb(null, true);
    } else {
      console.log('❌ File rejected (not an image)');
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- ROUTES ---
app.get("/", (req, res) => {
  console.log('🏠 Root route accessed');
  res.send("Backend is running ✅");
});

// Upload file with metadata support
app.post("/upload", upload.single("file"), (req, res) => { // Multer middleware is now part of the route handler
  console.log('\n🚀 UPLOAD ENDPOINT HIT');
  // console.log('Request headers:', req.headers); // Log headers if needed
  // console.log('Content-Type:', req.get('Content-Type')); // Log Content-Type

  if (req.fileValidationError) {
    console.error('❌ Multer fileValidationError:', req.fileValidationError);
    return res.status(400).json({ error: req.fileValidationError.message });
  }
  if (req.error) {
    console.error('❌ Multer error:', req.error);
    return res.status(400).json({ error: req.error.message });
  }

  if (!req.file) {
    console.log('❌ No file uploaded or Multer error occurred.');
    return res.status(400).json({ error: "File upload failed or no file provided." });
  }

  try {
    console.log('📥 After multer processing:');
    console.log(' - req.file exists:', !!req.file);
    console.log(' - req.body:', req.body); // Check if body is parsed correctly

    console.log('📄 File details:');
    console.log(' - Original name:', req.file.originalname);
    console.log(' - Filename:', req.file.filename);
    console.log(' - Size:', req.file.size, 'bytes');
    console.log(' - Mimetype:', req.file.mimetype);
    console.log(' - Current path (temp):', req.file.path);

    const section = req.body.section || "others";
    const title = req.body.title || "";
    const description = req.body.description || "";

    console.log('📂 Target section:', section);
    console.log('📝 Title:', title);
    console.log('📝 Description:', description);

    const tempPath = req.file.path;
    const finalDir = path.join(__dirname, "uploads", section);
    console.log('📁 Creating final section directory:', finalDir);

    fs.mkdirSync(finalDir, { recursive: true });
    console.log('✅ Section directory ready');

    const finalPath = path.join(finalDir, req.file.filename);
    console.log('🔄 Moving file from:', tempPath);
    console.log(' to:', finalPath);

    fs.renameSync(tempPath, finalPath);
    console.log('✅ File moved successfully');

    // Save metadata if provided
    if (title || description) {
      const metadata = {
        title: title,
        description: description,
        uploadDate: new Date().toISOString(), // Keep upload date as is
        originalName: req.file.originalname,
        section: section
      };
      console.log('💾 Saving metadata:', metadata);
      saveMetadata(finalPath, metadata);
    }

    // Construct the URL for the file
    const fileUrl = `/uploads/${section}/${req.file.filename}`;

    console.log('📤 Sending success response');
    console.log('File URL:', fileUrl);

    res.status(201).json({ // Use 201 Created status for successful uploads
      message: "File uploaded successfully!",
      file: {
        filename: req.file.filename,
        url: fileUrl,
        path: finalPath, // Path on the server
        metadata: { title, description, uploadDate: new Date().toISOString(), originalName: req.file.originalname, section: section }
      },
      section: section,
    });

  } catch (error) {
    console.error('💥 Upload processing error:', error);
    console.error('Error stack:', error.stack);
    // Clean up the temporary file if something went wrong after multer
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Cleaned up temporary file:', req.file.path);
      } catch (cleanupError) {
        console.error('❌ Error during temp file cleanup:', cleanupError);
      }
    }
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
});


// Get files from a section with metadata AND creation time for sorting
app.get("/files/:section", (req, res) => {
  console.log(`📋 Getting files for section: ${req.params.section}`);
  try {
    const section = req.params.section;
    const sectionPath = path.join(__dirname, "uploads", section);
    console.log('Looking for files in:', sectionPath);

    if (!fs.existsSync(sectionPath)) {
      console.log('📁 Section directory does not exist');
      return res.json({ files: [] });
    }

    const allEntries = fs.readdirSync(sectionPath);
    const filesWithData = [];

    for (const entryName of allEntries) {
      const entryPath = path.join(sectionPath, entryName);
      const stat = fs.statSync(entryPath);

      // Process only files (skip directories) and check for image extensions
      if (stat.isFile()) {
        const ext = path.extname(entryName).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
          const metadata = loadMetadata(entryPath);
          filesWithData.push({
            filename: entryName,
            url: `/uploads/${section}/${entryName}`,
            path: entryPath, // Full server path
            metadata: metadata || {},
            // --- ADDED: Store creation time for sorting ---
            // Use birthtime for creation time, fallback to mtime if birthtime not available
            creationTime: stat.birthtime || stat.mtime
          });
        }
      }
    }

    // --- SORTING LOGIC: Sort by creationTime descending (newest first) ---
    filesWithData.sort((a, b) => b.creationTime - a.creationTime);

    console.log(`📄 Found and sorted ${filesWithData.length} files`);
    res.json({ files: filesWithData });

  } catch (error) {
    console.error("❌ Error getting files:", error);
    res.status(500).json({ error: "Could not get files" });
  }
});

// Delete file and its metadata
app.delete("/delete", (req, res) => {
  console.log('🗑️ Delete request:', req.body);
  const { filename, section } = req.body;

  if (!filename || !section) {
    console.log('❌ Missing filename or section');
    return res.status(400).json({ error: "Filename and section are required" });
  }

  const filePath = path.join(__dirname, "uploads", section, filename);
  const metadataPath = getMetadataPath(filePath);

  console.log('Attempting to delete:', filePath);
  console.log('And metadata:', metadataPath);

  try {
    let deletedCount = 0;

    // Delete image file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Image deleted: ${section}/${filename}`);
      deletedCount++;
    }

    // Delete metadata file if it exists
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
      console.log(`✅ Metadata deleted: ${section}/${filename}.json`);
      deletedCount++;
    }

    if (deletedCount > 0) {
      res.json({ message: "File deleted successfully" });
    } else {
      console.log('❌ File not found for deletion');
      res.status(404).json({ error: "File not found" });
    }

  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Could not delete file" });
  }
});

// Get all sections and their file counts
app.get("/stats", (req, res) => {
  console.log('📊 Getting upload statistics');
  try {
    const uploadsPath = path.join(__dirname, "uploads");
    const stats = {};
    console.log('Checking uploads directory:', uploadsPath);

    if (fs.existsSync(uploadsPath)) {
      const sections = fs.readdirSync(uploadsPath).filter(item => {
        const itemPath = path.join(uploadsPath, item);
        const isDir = fs.statSync(itemPath).isDirectory();
        const notTemp = item !== 'temp';
        // console.log(` - ${item}: isDirectory=${isDir}, notTemp=${notTemp}`); // Detailed dir check
        return isDir && notTemp;
      });

      console.log('Valid sections found:', sections);

      sections.forEach(section => {
        const sectionPath = path.join(uploadsPath, section);
        const allFiles = fs.readdirSync(sectionPath);
        // Only count image files, not metadata files
        const imageFiles = allFiles.filter(filename => {
          const ext = path.extname(filename).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
        });
        stats[section] = imageFiles.length;
        console.log(` - ${section}: ${imageFiles.length} files`);
      });
    } else {
      console.log('❌ Uploads directory does not exist');
    }

    console.log('Final stats:', stats);
    res.json({ stats });

  } catch (error) {
    console.error("❌ Stats error:", error);
    res.status(500).json({ error: "Could not get stats" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Global error handler:', error);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log('🔍 404 - Route not found:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`🌐 Backend running on http://localhost:${PORT}`);
  console.log(`📁 File uploads will be saved to: ${path.join(__dirname, 'uploads')}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('📋 Available endpoints:');
  console.log(' - GET / (test)');
  console.log(' - POST /upload (file upload with metadata)');
  console.log(' - GET /files/:section (list files with metadata)');
  console.log(' - GET /stats (upload statistics)');
  console.log(' - DELETE /delete (delete file and metadata)');
  console.log('\n'); // Add a blank line for better readability
});