const prisma = require('../lib/prisma');

exports.listMaintenanceLogs = async (req, res) => {
  try {
    const logs = await prisma.maintenance_log.findMany({
      include: {
        resource: { select: { resource_name: true } },
        user_maintenance_log_reported_byTouser: { select: { name: true, email: true } },
        user_maintenance_log_assigned_toTouser: { select: { name: true, email: true } },
      },
      orderBy: { reported_date: 'desc' },
    });

    const result = logs.map((l) => ({
      maintenance_id: l.maintenance_id,
      resource_id: l.resource_id,
      resource_name: l.resource.resource_name,
      reported_by: l.reported_by,
      reported_by_name: l.user_maintenance_log_reported_byTouser.name,
      assigned_to: l.assigned_to,
      assigned_to_name: l.user_maintenance_log_assigned_toTouser?.name || null,
      issue_desc: l.issue_desc,
      priority: l.priority,
      status: l.status,
      reported_date: l.reported_date,
      resolved_date: l.resolved_date,
    }));

    res.json(result);
  } catch (err) {
    console.error('List maintenance logs error:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance logs.' });
  }
};

exports.reportIssue = async (req, res) => {
  try {
    const { resource_id, issue_desc, priority } = req.body;

    const resource = await prisma.resource.findUnique({
      where: { resource_id: parseInt(resource_id) },
    });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const log = await prisma.maintenance_log.create({
      data: {
        resource_id: parseInt(resource_id),
        reported_by: req.user.user_id,
        issue_desc,
        priority: priority || 'Medium',
      },
    });

    if (priority === 'Critical') {
      await prisma.resource.update({
        where: { resource_id: parseInt(resource_id) },
        data: { status: 'Under_Maintenance' },
      });
    }

    res.status(201).json(log);
  } catch (err) {
    console.error('Report issue error:', err);
    res.status(500).json({ error: 'Failed to report issue.' });
  }
};

exports.updateMaintenanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const log = await prisma.maintenance_log.findUnique({
      where: { maintenance_id: parseInt(id) },
    });
    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }

    const validTransitions = {
      'Reported': ['In_Progress', 'Resolved', 'Closed'],
      'In_Progress': ['Resolved', 'Closed'],
      'Resolved': ['Closed'],
      'Closed': [],
    };
    if (status && validTransitions[log.status] && !validTransitions[log.status].includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${log.status} to ${status}.` });
    }

    const data = {};
    if (status) data.status = status;
    if (assigned_to !== undefined) data.assigned_to = assigned_to ? parseInt(assigned_to) : null;
    if (status === 'Resolved' || status === 'Closed') {
      data.resolved_date = new Date();
      // Check if resource should be set back to Available
      const resource = await prisma.resource.findUnique({ where: { resource_id: log.resource_id } });
      if (resource && resource.status === 'Under_Maintenance') {
        await prisma.resource.update({
          where: { resource_id: log.resource_id },
          data: { status: 'Available' },
        });
      }
    }

    const updated = await prisma.maintenance_log.update({
      where: { maintenance_id: parseInt(id) },
      data,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update maintenance log error:', err);
    res.status(500).json({ error: 'Failed to update maintenance log.' });
  }
};
