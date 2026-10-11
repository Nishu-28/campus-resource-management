const prisma = require('../lib/prisma');

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return null;
  return new Date(t).toISOString().slice(11, 16);
}

exports.listPendingApprovals = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { booking_status: 'Pending' },
      include: {
        resource: { select: { resource_name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = bookings.map((b) => ({
      booking_id: b.booking_id,
      user_id: b.user_id,
      resource_id: b.resource_id,
      resource_name: b.resource.resource_name,
      booked_by: b.user.name,
      booked_by_email: b.user.email,
      booking_date: formatDate(b.booking_date),
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      purpose: b.purpose,
      attendee_count: b.attendee_count,
      booking_status: b.booking_status,
      created_at: b.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('List pending approvals error:', err);
    res.status(500).json({ error: 'Failed to fetch pending approvals.' });
  }
};

exports.processApproval = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { decision, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be Approved or Rejected.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(bookingId) },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (booking.booking_status !== 'Pending') {
      return res.status(400).json({ error: `Booking has already been ${booking.booking_status.toLowerCase()}.` });
    }

    if (booking.user_id === req.user.user_id) {
      return res.status(403).json({ error: 'You cannot approve your own booking.' });
    }

    const [approval, updatedBooking] = await prisma.$transaction([
      prisma.approval.create({
        data: {
          booking_id: parseInt(bookingId),
          approved_by: req.user.user_id,
          decision,
          remarks: remarks || null,
        },
      }),
      prisma.booking.update({
        where: { booking_id: parseInt(bookingId) },
        data: { booking_status: decision },
      }),
    ]);

    res.json({ approval, booking: updatedBooking });
  } catch (err) {
    console.error('Process approval error:', err);
    res.status(500).json({ error: 'Failed to process approval.' });
  }
};
