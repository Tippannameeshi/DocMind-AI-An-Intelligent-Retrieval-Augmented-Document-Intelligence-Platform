const AuthService = require('../services/authService');

/**
 * Register user controller
 */
const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // Basic Input Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide email, password, and full name.' },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long.' },
      });
    }

    const data = await AuthService.register({ email, password, fullName });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user controller
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide email and password.' },
      });
    }

    const data = await AuthService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout controller
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
