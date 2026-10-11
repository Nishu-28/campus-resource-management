const prisma = require('../lib/prisma');

exports.listRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { role_id: 'asc' },
    });
    res.json(roles);
  } catch (err) {
    console.error('List roles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
};
