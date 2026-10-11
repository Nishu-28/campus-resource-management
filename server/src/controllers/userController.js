const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: { select: { role_name: true } },
        department: { select: { dept_name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = users.map((u) => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      dept_id: u.dept_id,
      dept_name: u.department.dept_name,
      role_id: u.role_id,
      role_name: u.role.role_name,
      is_active: u.is_active,
      created_at: u.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, dept_id, role_id } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        phone: phone || null,
        dept_id: parseInt(dept_id),
        role_id: parseInt(role_id),
      },
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, dept_id, role_id } = req.body;

    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (dept_id !== undefined) data.dept_id = parseInt(dept_id);
    if (role_id !== undefined) data.role_id = parseInt(role_id);

    const updated = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data,
    });

    const { password_hash: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: { department: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;

    const updated = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data,
      include: { department: true, role: true },
    });

    const { password_hash, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Support both bcrypt and legacy SHA-256 hashes
    let isValid = false;
    if (user.password_hash.startsWith('$2')) {
      isValid = await bcrypt.compare(current_password, user.password_hash);
    } else {
      const crypto = require('crypto');
      const sha256 = crypto.createHash('sha256').update(current_password).digest('hex');
      isValid = sha256 === user.password_hash;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { password_hash: hashedPassword },
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (parseInt(id) === req.user.user_id) {
      return res.status(403).json({ error: 'You cannot deactivate your own account.' });
    }

    const updated = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: { is_active: !user.is_active },
    });

    const { password_hash: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Toggle active error:', err);
    res.status(500).json({ error: 'Failed to toggle user active status.' });
  }
};
