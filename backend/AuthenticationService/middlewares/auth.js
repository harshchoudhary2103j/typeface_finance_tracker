const { UnauthenticatedError } = require('../errors');

const jwt = require('jsonwebtoken');
const config = require('../config/env');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError('Authentication invalid');
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log('JWT Payload:', payload);
        
        req.user = { 
          userId: payload.userId, 
          name: payload.name,
          email: payload.email
        };
        
        console.log('Setting user in request:', req.user);
        next();
    } catch (error) {
        throw new UnauthenticatedError('Authentication invalid');
    }
}

module.exports = auth;