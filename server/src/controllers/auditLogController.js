const prisma = require('../lib/prisma');

exports.listAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { action_type, search } = req.query;

    const where = {};
    if (action_type) where.action_type = action_type;
    if (search) {
      where.OR = [
        { table_name: { contains: search } },
        { new_value: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { action_time: 'desc' },
      }),
      prisma.audit_log.count({ where }),
    ]);

    const formatted = logs.map((l) => ({
      audit_id: l.log_id,
      user_name: l.user?.name || 'System',
      action_type: l.action_type,
      table_name: l.table_name,
      record_id: l.record_id,
      old_values: l.old_value,
      new_values: l.new_value,
      ip_address: l.ip_address,
      created_at: l.action_time,
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: formatted,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('List audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};
