import { body, validationResult } from 'express-validator';

const validate = (method) => {
  switch(method) {
    case 'register':
      return [
        body('name')
          .trim()
          .notEmpty().withMessage('Name is required')
          .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
        
        body('email')
          .trim()
          .notEmpty().withMessage('Email is required')
          .isEmail().withMessage('Invalid email format')
          .normalizeEmail(),
        
        body('password')
          .notEmpty().withMessage('Password is required')
          .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
          .withMessage('Password must contain uppercase, lowercase, and number')
      ];

    case 'question':
      return [
        body('type')
          .isIn(['MCQ', 'Integer']).withMessage('Invalid question type'),
        
        body('options')
          .custom((value, { req }) => {
            if (req.body.type === 'MCQ') {
              if (!Array.isArray(value) || value.length !== 4) {
                throw new Error('MCQ requires exactly 4 options');
              }
              if (new Set(value).size !== 4) {
                throw new Error('MCQ options must be unique');
              }
            }
            if (req.body.type === 'Integer' && value.length > 0) {
              throw new Error('Integer questions should not have options');
            }
            return true;
          }),
        
        body('answer')
          .custom((value, { req }) => {
            if (req.body.type === 'MCQ') {
              if (!Number.isInteger(value) || value < 0 || value > 3) {
                throw new Error('MCQ answer must be 0-3');
              }
            }
            if (req.body.type === 'Integer' && (!Number.isInteger(value) || value < 0)) {
              throw new Error('Integer answer must be non-negative');
            }
            return true;
          }),
        
        body('image')
          .if(body('image').exists())
          .isURL().withMessage('Invalid image URL format')
      ];

    case 'questionSet':
      return [
        body('year')
          .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
          .withMessage('Invalid year'),
        
        body('slot')
          .matches(/^[A-Za-z]{3} \d{2} Shift \d$/)
          .withMessage('Invalid slot format (e.g., "Jan 27 Shift 1")'),
        
        body('questions')
          .isArray({ min: 90, max: 90 }).withMessage('Must contain exactly 90 questions')
          .custom(questions => {
            const ids = new Set();
            for (const q of questions) {
              if (ids.has(q.question_id)) throw new Error('Duplicate question_id found');
              ids.add(q.question_id);
            }
            return true;
          })
      ];

    case 'saveProgress':
      return [
        body('responses')
          .isArray().withMessage('Responses must be an array')
          .isLength({ min: 90, max: 90 }).withMessage('Must answer all 90 questions')
      ];

    // Keep existing login and attempt validations
    // ...
  }
};

// Enhanced validation handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'fail',
      errors: errors.array().reduce((acc, err) => {
        acc[err.param] = acc[err.param] || [];
        acc[err.param].push(err.msg);
        return acc;
      }, {})
    });
  }
  next();
};

export { validate, handleValidation };