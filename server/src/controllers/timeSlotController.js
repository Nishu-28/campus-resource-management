const prisma = require('../lib/prisma');

exports.listTimeSlots = async (req, res) => {
  try {
    const timeSlots = await prisma.time_slot.findMany({
      orderBy: { start_time: 'asc' },
    });

    res.json(timeSlots);
  } catch (err) {
    console.error('List time slots error:', err);
    res.status(500).json({ error: 'Failed to fetch time slots.' });
  }
};

exports.createTimeSlot = async (req, res) => {
  try {
    const { slot_label, start_time, end_time, is_active } = req.body;

    const timeSlot = await prisma.time_slot.create({
      data: {
        slot_label,
        start_time: new Date(`1970-01-01T${start_time}`),
        end_time: new Date(`1970-01-01T${end_time}`),
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    res.status(201).json(timeSlot);
  } catch (err) {
    console.error('Create time slot error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Time slot with this start and end time already exists.' });
    }
    res.status(500).json({ error: 'Failed to create time slot.' });
  }
};

exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot_label, start_time, end_time, is_active } = req.body;

    const data = {};
    if (slot_label !== undefined) data.slot_label = slot_label;
    if (start_time !== undefined) data.start_time = new Date(`1970-01-01T${start_time}`);
    if (end_time !== undefined) data.end_time = new Date(`1970-01-01T${end_time}`);
    if (is_active !== undefined) data.is_active = is_active;

    const timeSlot = await prisma.time_slot.update({
      where: { slot_id: parseInt(id) },
      data,
    });

    res.json(timeSlot);
  } catch (err) {
    console.error('Update time slot error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Time slot not found.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Time slot with this start and end time already exists.' });
    }
    res.status(500).json({ error: 'Failed to update time slot.' });
  }
};

exports.deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slotId = parseInt(id);

    // Check if any bookings reference this time slot
    const bookingCount = await prisma.booking.count({
      where: { slot_id: slotId },
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        error: `Cannot delete time slot. ${bookingCount} booking(s) reference it.`,
      });
    }

    await prisma.time_slot.delete({
      where: { slot_id: slotId },
    });

    res.json({ message: 'Time slot deleted successfully.' });
  } catch (err) {
    console.error('Delete time slot error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Time slot not found.' });
    }
    res.status(500).json({ error: 'Failed to delete time slot.' });
  }
};
