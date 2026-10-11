const prisma = require('../lib/prisma');

exports.listResourcePolicies = async (req, res) => {
  try {
    const policies = await prisma.resource_policy.findMany({
      include: {
        resource_category: { select: { category_id: true, category_name: true } },
      },
      orderBy: { policy_id: 'asc' },
    });

    res.json(policies);
  } catch (err) {
    console.error('List resource policies error:', err);
    res.status(500).json({ error: 'Failed to fetch resource policies.' });
  }
};

exports.createResourcePolicy = async (req, res) => {
  try {
    const {
      category_id,
      policy_name,
      max_duration_hrs,
      advance_booking_days,
      cancellation_hrs,
      requires_approval,
      auto_release_mins,
    } = req.body;

    const policy = await prisma.resource_policy.create({
      data: {
        category_id: parseInt(category_id),
        policy_name,
        max_duration_hrs: max_duration_hrs !== undefined ? parseInt(max_duration_hrs) : 2,
        advance_booking_days: advance_booking_days !== undefined ? parseInt(advance_booking_days) : 7,
        cancellation_hrs: cancellation_hrs !== undefined ? parseInt(cancellation_hrs) : 24,
        requires_approval: requires_approval !== undefined ? requires_approval : true,
        auto_release_mins: auto_release_mins !== undefined ? parseInt(auto_release_mins) : 15,
      },
    });

    res.status(201).json(policy);
  } catch (err) {
    console.error('Create resource policy error:', err);
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Referenced resource category does not exist.' });
    }
    res.status(500).json({ error: 'Failed to create resource policy.' });
  }
};

exports.updateResourcePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      policy_name,
      max_duration_hrs,
      advance_booking_days,
      cancellation_hrs,
      requires_approval,
      auto_release_mins,
    } = req.body;

    const data = {};
    if (category_id !== undefined) data.category_id = parseInt(category_id);
    if (policy_name !== undefined) data.policy_name = policy_name;
    if (max_duration_hrs !== undefined) data.max_duration_hrs = parseInt(max_duration_hrs);
    if (advance_booking_days !== undefined) data.advance_booking_days = parseInt(advance_booking_days);
    if (cancellation_hrs !== undefined) data.cancellation_hrs = parseInt(cancellation_hrs);
    if (requires_approval !== undefined) data.requires_approval = requires_approval;
    if (auto_release_mins !== undefined) data.auto_release_mins = parseInt(auto_release_mins);

    const policy = await prisma.resource_policy.update({
      where: { policy_id: parseInt(id) },
      data,
    });

    res.json(policy);
  } catch (err) {
    console.error('Update resource policy error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource policy not found.' });
    }
    res.status(500).json({ error: 'Failed to update resource policy.' });
  }
};

exports.deleteResourcePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.resource_policy.delete({
      where: { policy_id: parseInt(id) },
    });

    res.json({ message: 'Resource policy deleted successfully.' });
  } catch (err) {
    console.error('Delete resource policy error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource policy not found.' });
    }
    res.status(500).json({ error: 'Failed to delete resource policy.' });
  }
};
