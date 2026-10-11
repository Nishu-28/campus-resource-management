const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
    }

    // The existing passwords are stored using MySQL SHA2() which produces a hex string.
    // We'll support both: bcrypt hashes (for new passwords) and SHA-256 hex (legacy).
    let isValid = false;
    if (user.password_hash.startsWith('$2')) {
      // bcrypt hash
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy SHA-256 hex comparison
      const crypto = require('crypto');
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      isValid = sha256 === user.password_hash;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role_name: user.role.role_name,
        dept_id: user.dept_id,
        dept_name: user.department.dept_name,
        can_approve: user.role.can_approve,
        can_book: user.role.can_book,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_name: user.role.role_name,
        dept_name: user.department.dept_name,
        can_approve: user.role.can_approve,
        can_book: user.role.can_book,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: { role: true, department: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_name: user.role.role_name,
      dept_name: user.department.dept_name,
      can_approve: user.role.can_approve,
      can_book: user.role.can_book,
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { login, getMe };
