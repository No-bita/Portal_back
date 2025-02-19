import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // 1. Validate Authorization Header
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error',
      code: 'MISSING_TOKEN',
      message: 'Authorization header with Bearer token required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify Token Asynchronously
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Validate Token Payload
    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_PAYLOAD',
        message: 'Token missing required user data'
      });
    }

    // 4. Construct User Object
    req.user = {
      id: decoded.id,
      role: decoded.role,
      sessionId: decoded.sessionId || null,
      tokenIssuedAt: decoded.iat * 1000 // Convert to milliseconds
    };

    // 5. Add Security Headers
    res.header({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });

    next();
    
  } catch (error) {
    // 6. Enhanced Error Handling
    const errorConfig = {
      TokenExpiredError: {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again'
      },
      JsonWebTokenError: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication credentials'
      },
      NotBeforeError: {
        code: 'TOKEN_INACTIVE',
        message: 'Session not yet active'
      }
    };

    const { code, message } = errorConfig[error.name] || { 
      code: 'AUTH_FAILURE', 
      message: 'Authentication failed' 
    };

    console.error(`🔒 Auth Error [${code}]: ${error.message}`);
    
    return res.status(401).json({
      status: 'error',
      code,
      message
    });
  }
};
// Original code remains the same, just fix the export
const authMiddleware = (req, res, next) => {
    // ... existing code ...
  };
  
  // Add authorization middleware
  export const authorize = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        });
      }
      next();
    };
  };
  
  // Named exports instead of default
  export { authMiddleware, authorize };
export default authMiddleware;