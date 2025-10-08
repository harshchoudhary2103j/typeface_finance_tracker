const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (typeof name !== 'string' || name.split(' ').length < 2) {
    throw new BadRequestError('Please provide a full name with at least a first and last name');
  }

  const nameParts = name.split(' ');
  const firstname = nameParts[0];
  const lastname = nameParts[nameParts.length - 1];
  const middlename = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

  const userObject = {
    name: {
      firstname,
      lastname,
    },
    email,
    password,
  };

  if (middlename) {
    userObject.name.middlename = middlename;
  }

  const user = await User.create(userObject);
  const token = user.createJWT();
  
  res.status(StatusCodes.CREATED).json({ 
    user: { 
      id: user._id.toString(),
      _id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email
    }, 
    token 
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();
  
  res.status(StatusCodes.OK).json({ 
    user: { 
      id: user._id.toString(),
      _id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email
    }, 
    token 
  });
};

const verify = (req, res) => {
  console.log("Verifying user:", req.user);
  
  // Return user info for nginx headers
  res.status(StatusCodes.OK)
    .set('X-User-Id', req.user.userId)
    .set('X-User-Name', req.user.name ? `${req.user.name.firstname} ${req.user.name.lastname}` : '')
    .set('X-User-Email', req.user.email)
    .json({
      success: true,
      user: {
        id: req.user.userId,
        _id: req.user.userId,
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email
      }
    });
}

module.exports = {
  register,
  login,
  verify
};
