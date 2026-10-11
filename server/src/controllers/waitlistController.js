const prisma = require('../lib/prisma');

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return null;
  return new Date(t).toISOString().slice(11, 16);
}

exports.listWaitlist = async (req, res) => {
  try {
    const where = {};
    if (req.user.role_name !== 'Admin') {
      where.user_id = req.user.user_id;
    }

    const entries = await prisma.waitlist.findMany({
      where,
      include: {
        resource: { select: { resource_name: true } },
        user: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = entries.map((e) => ({
      ...e,
      resource_name: e.resource.resource_name,
      user_name: e.user.name,
      requested_date: formatDate(e.requested_date),
      start_time: formatTime(e.start_time),
      end_time: formatTime(e.end_time),
      resource: undefined,
      user: undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error('List waitlist error:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist.' });
  }
};

exports.joinWaitlist = async (req, res) => {
  try {
    const { resource_id, requested_date, start_time, end_time, purpose } = req.body;

    const resource = await prisma.resource.findUnique({
      where: { resource_id: parseInt(resource_id) },
    });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const existing = await prisma.waitlist.findFirst({
      where: {
        user_id: req.user.user_id,
        resource_id: parseInt(resource_id),
        requested_date: new Date(requested_date),
        status: 'Waiting',
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'You are already on the waitlist for this resource on this date.' });
    }

    const entry = await prisma.waitlist.create({
      data: {
        user_id: req.user.user_id,
        resource_id: parseInt(resource_id),
        requested_date: new Date(requested_date),
        start_time: start_time ? new Date(`1970-01-01T${start_time}:00Z`) : null,
        end_time: end_time ? new Date(`1970-01-01T${end_time}:00Z`) : null,
        purpose: purpose || null,
      },
    });

    res.status(201).json({
      ...entry,
      requested_date: formatDate(entry.requested_date),
      start_time: formatTime(entry.start_time),
      end_time: formatTime(entry.end_time),
    });
  } catch (err) {
    console.error('Join waitlist error:', err);
    res.status(500).json({ error: 'Failed to join waitlist.' });
  }
};

exports.removeFromWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.waitlist.findUnique({
      where: { waitlist_id: parseInt(id) },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }
    if (entry.user_id !== req.user.user_id && req.user.role_name !== 'Admin') {
      return res.status(403).json({ error: 'You can only remove your own waitlist entries.' });
    }

    await prisma.waitlist.delete({
      where: { waitlist_id: parseInt(id) },
    });

    res.json({ message: 'Removed from waitlist.' });
  } catch (err) {
    console.error('Remove from waitlist error:', err);
    res.status(500).json({ error: 'Failed to remove from waitlist.' });
  }
};
