const prisma = require('../lib/prisma');

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.user_id },
      orderBy: { created_at: 'desc' },
    });
    res.json(notifications);
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { notification_id: parseInt(id) },
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    if (notification.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your notification.' });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: parseInt(id) },
      data: { is_read: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.user_id, is_read: false },
      data: { is_read: true },
    });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { user_id: req.user.user_id, is_read: false },
    });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Failed to fetch unread count.' });
  }
};
