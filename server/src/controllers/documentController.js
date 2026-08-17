const DocumentModel = require('../models/documentModel');
const PdfService = require('../services/pdfService');

/**
 * Upload single or multiple PDF documents
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'No document file uploaded.' },
      });
    }

    const files = req.files || [req.file];
    const createdDocuments = [];

    for (const file of files) {
      // 1. Create document record in DB
      const document = await DocumentModel.create({
        userId: req.user.id,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // 2. Trigger asynchronous document processing pipeline (parsing, chunking, embeddings, pgvector storage)
      PdfService.processDocument(document.id, file.path).catch(err => {
        console.error(`Background processing error for document ${document.id}:`, err);
      });

      createdDocuments.push(document);
    }

    res.status(201).json({
      success: true,
      message: 'Document(s) uploaded successfully. Background vector processing initiated.',
      data: { documents: createdDocuments },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List uploaded documents for current user with optional filtering
 */
const getDocuments = async (req, res, next) => {
  try {
    const { search, status, dateFrom, dateTo } = req.query;
    const documents = await DocumentModel.findByUserId(req.user.id, {
      search,
      status,
      dateFrom,
      dateTo,
    });
    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single document by ID
 */
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.findById(id, req.user.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: { message: 'Document not found.' },
      });
    }

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete document and associated vectors
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    await PdfService.deleteDocument(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Document and vectors deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
};
