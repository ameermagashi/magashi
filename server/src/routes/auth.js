const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['staff', 'it_officer']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const role = req.body.role === 'it_officer' ? 'it_officer' : 'staff';

    try {
      const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
      );

      const user = { id: result.insertId, name, email, role };
      const token = signToken(user);
      return res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ message: 'Unable to create account' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const rows = await query(
        'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = signToken(user);
      return res.json({ token, user: publicUser(user) });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Unable to sign in' });
    }
  }
);

router.get('/me', authenticate, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Unable to load profile' });
  }
});

module.exports = router;
