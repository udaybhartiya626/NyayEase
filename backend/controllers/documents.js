const Document = require('../models/Document');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

// @desc    Upload document for a case
// @route   POST /api/cases/:caseId/documents
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const caseItem = await Case.findById(req.params.caseId);
    
    if (!caseItem) {
      // Remove the uploaded file if case not found
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check authorization
    if (
      req.user.role === 'litigant' && caseItem.litigant.toString() !== req.user.id &&
      req.user.role === 'advocate' && !caseItem.advocates.includes(req.user.id)
    ) {
      // Remove the uploaded file if not authorized
      fs.unlinkSync(req.file.path);
      
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload documents for this case'
      });
    }
    
    // Create document record
    const fileExt = path.extname(req.file.originalname).substring(1);
    
    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      description: req.body.description || '',
      fileType: fileExt,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      case: req.params.caseId,
      isPublic: req.body.isPublic === 'true',
      tags: req.body.tags ? req.body.tags.split(',') : []
    });
    
    // Add document to case
    caseItem.documents.push(document._id);
    await caseItem.save();
    
    // Create notifications for relevant parties
    const notificationPromises = [];
    
    // Notify the litigant if document uploaded by advocate or court officer
    if (req.user.role !== 'litigant') {
      notificationPromises.push(
        Notification.create({
          title: 'New Document Added',
          message: `A new document "${document.name}" has been added to your case.`,
          recipient: caseItem.litigant,
          sender: req.user.id,
          type: 'document',
          relatedCase: caseItem._id,
          relatedDocument: document._id
        })
      );
    }
    
    // Notify advocates if document uploaded by litigant or court officer
    if (req.user.role !== 'advocate' && caseItem.advocates.length > 0) {
      caseItem.advocates.forEach(advocateId => {
        notificationPromises.push(
          Notification.create({
            title: 'New Document Added',
            message: `A new document "${document.name}" has been added to case "${caseItem.title}".`,
            recipient: advocateId,
            sender: req.user.id,
            type: 'document',
            relatedCase: caseItem._id,
            relatedDocument: document._id
          })
        );
      });
    }
    
    // Notify court officer if assigned and document uploaded by litigant or advocate
    if (req.user.role !== 'court-officer' && caseItem.assignedJudge) {
      notificationPromises.push(
        Notification.create({
          title: 'New Document Added',
          message: `A new document "${document.name}" has been added to case "${caseItem.title}".`,
          recipient: caseItem.assignedJudge,
          sender: req.user.id,
          type: 'document',
          relatedCase: caseItem._id,
          relatedDocument: document._id
        })
      );
    }
    
    await Promise.all(notificationPromises);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    // Remove the uploaded file if an error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    next(error);
  }
};

// @desc    Get documents for a case
// @route   GET /api/cases/:caseId/documents
// @access  Private
exports.getDocuments = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.caseId);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check authorization
    if (
      req.user.role === 'litigant' && caseItem.litigant.toString() !== req.user.id &&
      req.user.role === 'advocate' && !caseItem.advocates.includes(req.user.id) &&
      req.user.role !== 'court-officer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access documents for this case'
      });
    }
    
    const documents = await Document.find({ case: req.params.caseId })
      .sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const caseItem = await Case.findById(document.case);
    
    // Check authorization
    if (
      req.user.role === 'litigant' && caseItem.litigant.toString() !== req.user.id &&
      req.user.role === 'advocate' && !caseItem.advocates.includes(req.user.id) &&
      req.user.role !== 'court-officer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const caseItem = await Case.findById(document.case);
    
    // Check authorization
    if (
      req.user.role === 'litigant' && caseItem.litigant.toString() !== req.user.id &&
      req.user.role === 'advocate' && !caseItem.advocates.includes(req.user.id) &&
      req.user.role !== 'court-officer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this document'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on the server'
      });
    }
    
    res.download(document.filePath, document.name);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const caseItem = await Case.findById(document.case);
    
    // Check authorization
    if (
      document.uploadedBy.toString() !== req.user.id &&
      req.user.role === 'litigant' && caseItem.litigant.toString() !== req.user.id &&
      req.user.role !== 'court-officer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }
    
    // Delete the file from the server
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Remove document from case
    caseItem.documents = caseItem.documents.filter(
      doc => doc.toString() !== req.params.id
    );
    await caseItem.save();
    
    // Delete the document record
    await document.remove();
    
    // Delete related notifications
    await Notification.deleteMany({ relatedDocument: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 