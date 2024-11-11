const express = require('express');
const router = express.Router();
const documentsController = require('../controller/documentsController');
const { upload } = require("../middleware/multer.middleware");

// Routes for managing documents
router.post('/employees/:employeeId/documents', upload.single('file'), documentsController.addDocument);
router.put('/employees/documents/:documentId', upload.single('file'), documentsController.updateDocument);
router.delete('/employees/:employeeId/documents/:documentId', documentsController.deleteDocument);
router.get('/employees/documents/:employeeId', documentsController.getAllDocumentsUser);
module.exports = router;
