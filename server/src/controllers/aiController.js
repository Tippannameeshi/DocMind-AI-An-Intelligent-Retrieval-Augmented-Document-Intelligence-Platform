const AIService = require('../services/aiService');

/**
 * Generate specialized AI insights (summary, quiz, flashcards, key contributions, future work)
 */
const generateFeature = async (req, res, next) => {
  try {
    const { documentId, featureType } = req.body;

    if (!documentId || !featureType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide documentId and featureType.' },
      });
    }

    const data = await AIService.generateFeature({
      userId: req.user.id,
      documentId,
      featureType,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateFeature,
};
