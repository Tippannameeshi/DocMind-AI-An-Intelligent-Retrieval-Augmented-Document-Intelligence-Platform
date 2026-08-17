const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

/**
 * Higher-order middleware factory to validate request body, params, or query against Zod schemas
 */
const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Re-assign sanitized data back to request
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Invalid request input data', details));
    }
    next(err);
  }
};

// --- Common Validation Schemas ---

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().min(2, 'Full name is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const createChatSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    documentIds: z.array(z.string()).optional(),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Question query cannot be empty'),
    documentIds: z.array(z.string()).optional(),
  }),
});

const updateChatTitleSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Chat ID is required'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty'),
  }),
});

const generateAiFeatureSchema = z.object({
  body: z.object({
    documentId: z.string().min(1, 'Document ID is required'),
    featureType: z.enum(
      ['summary', 'quiz', 'flashcards', 'contributions', 'future_work'],
      { errorMap: () => ({ message: 'Invalid AI feature type specified' }) }
    ),
  }),
});

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    createChat: createChatSchema,
    sendMessage: sendMessageSchema,
    updateChatTitle: updateChatTitleSchema,
    generateAiFeature: generateAiFeatureSchema,
  },
};
