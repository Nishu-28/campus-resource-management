const prisma = require('../lib/prisma');

exports.listUsageLogs = async (req, res) => {
  try {
    const where = {};
    // Non-Admin/HOD users can only see their own usage logs
    if (req.user.role_name !== 'Admin' && req.user.role_name !== 'HOD') {
      where.booking = { user_id: req.user.user_id };
    }

    const logs = await prisma.usage_log.findMany({
      where,
      include: {
        booking: {
          include: {
            resource: { select: { resource_name: true } },
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { check_in_time: 'desc' },
    });

    const result = logs.map((l) => ({
      usage_id: l.usage_id,
      booking_id: l.booking_id,
      resource_name: l.booking.resource.resource_name,
      booked_by: l.booking.user.name,
      check_in_time: l.check_in_time,
      check_out_time: l.check_out_time,
      actual_attendees: l.actual_attendees,
      feedback_rating: l.feedback_rating,
      remarks: l.remarks,
    }));

    res.json(result);
  } catch (err) {
    console.error('List usage logs error:', err);
    res.status(500).json({ error: 'Failed to fetch usage logs.' });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(booking_id) },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (booking.booking_status !== 'Approved') {
      return res.status(400).json({ error: 'Booking must be Approved to check in.' });
    }

    if (booking.user_id !== req.user.user_id && req.user.role_name !== 'Admin') {
      return res.status(403).json({ error: 'You can only check in to your own bookings.' });
    }

    const existingLog = await prisma.usage_log.findFirst({
      where: { booking_id: parseInt(booking_id) },
    });
    if (existingLog) {
      return res.status(400).json({ error: 'Already checked in for this booking.' });
    }

    const log = await prisma.usage_log.create({
      data: {
        booking_id: parseInt(booking_id),
        check_in_time: new Date(),
      },
    });

    res.status(201).json(log);
  } catch (err) {
    console.error('Check in error:', err);
    res.status(500).json({ error: 'Failed to check in.' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_attendees, feedback_rating, remarks } = req.body;

    const log = await prisma.usage_log.findUnique({
      where: { usage_id: parseInt(id) },
    });
    if (!log) {
      return res.status(404).json({ error: 'Usage log not found.' });
    }
    if (log.check_out_time) {
      return res.status(400).json({ error: 'Already checked out.' });
    }

    if (!log.check_in_time) {
      return res.status(400).json({ error: 'Must check in before checking out.' });
    }

    if (feedback_rating && (parseInt(feedback_rating) < 1 || parseInt(feedback_rating) > 5)) {
      return res.status(400).json({ error: 'Feedback rating must be between 1 and 5.' });
    }

    const updated = await prisma.usage_log.update({
      where: { usage_id: parseInt(id) },
      data: {
        check_out_time: new Date(),
        actual_attendees: actual_attendees ? parseInt(actual_attendees) : null,
        feedback_rating: feedback_rating ? parseInt(feedback_rating) : null,
        remarks: remarks || null,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Check out error:', err);
    res.status(500).json({ error: 'Failed to check out.' });
  }
};
