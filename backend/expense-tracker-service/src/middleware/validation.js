const Joi = require('joi');

// Import subclasses from constants file
const { incomeSubclasses, expenseSubclasses } = require('../constants/transactionSubclasses');

// Custom validation for subclass based on type
const subclassValidation = (value, helpers) => {
  const type = helpers.state.ancestors[0].type;
  
  if (type === 'income' && !incomeSubclasses.includes(value)) {
    return helpers.error('any.invalid', { 
      message: `Invalid income subclass. Allowed values: ${incomeSubclasses.join(', ')}` 
    });
  }
  
  if (type === 'expense' && !expenseSubclasses.includes(value)) {
    return helpers.error('any.invalid', { 
      message: `Invalid expense subclass. Allowed values: ${expenseSubclasses.join(', ')}` 
    });
  }
  
  return value;
};

// Transaction validation schema
const transactionSchema = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid user ID format'
  }),
  type: Joi.string().valid('income', 'expense').required(),
  subclass: Joi.string().custom(subclassValidation).required(),
  amount: Joi.number().positive().min(0.01).precision(2).required(),
  description: Joi.string().max(500).optional().allow('').trim(),
  date: Joi.date().required(),
  paymentMethod: Joi.when('type', {
    is: 'expense',
    then: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'check', 'other').default('other'),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Payment method should not be specified for income transactions'
    })
  })
});

// Transaction update validation schema (all fields optional except type/subclass dependency)
const transactionUpdateSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').optional(),
  subclass: Joi.string().custom(subclassValidation).optional(),
  amount: Joi.number().positive().min(0.01).precision(2).optional(),
  description: Joi.string().max(500).optional().allow('').trim(),
  date: Joi.date().optional(),
  paymentMethod: Joi.when('type', {
    is: 'expense',
    then: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'check', 'other').optional(),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Payment method should not be specified for income transactions'
    })
  })
}).min(1); // At least one field must be provided

// Middleware functions
const validateTransaction = (req, res, next) => {
  console.log('Validating transaction:', req.body);
  console.log('All Headers:', req.headers);
  
  // Extract userId from headers (set by nginx after authentication)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    console.error('❌ No X-User-Id header found!');
    console.error('Available headers:', Object.keys(req.headers));
    console.error('Authorization header:', req.headers.authorization);
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required. User ID not found in request headers.',
      debug: {
        availableHeaders: Object.keys(req.headers),
        hasAuth: !!req.headers.authorization
      }
    });
  }
  
  console.log('✅ Found userId in headers:', userId);
  
  const { type, subclass, amount, description, date } = req.body;
  
  // Basic validation
  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Valid transaction type (income/expense) is required'
    });
  }
  
  if (!subclass) {
    return res.status(400).json({
      success: false,
      message: 'Transaction subclass is required'
    });
  }
  
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount greater than 0 is required'
    });
  }
  
  if (!description || description.trim().length < 1) {
    return res.status(400).json({
      success: false,
      message: 'Description is required'
    });
  }
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Transaction date is required'
    });
  }
  
  // Payment method validation for expenses
  if (type === 'expense' && !req.body.paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required for expense transactions'
    });
  }
  
  console.log('✅ Validation passed for user:', userId);
  next();
};

const validateTransactionUpdate = (req, res, next) => {
  console.log('Validating transaction update:', req.body);
  console.log('Headers:', req.headers);
  
  // Extract userId from headers (set by nginx after authentication)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID not found in request headers'
    });
  }
  
  console.log('Update validation passed for user:', userId);
  next();
};

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validateTransaction,
  validateTransactionUpdate,
  validate,
  transactionSchema,
  transactionUpdateSchema
};