const prisma = require('../lib/prisma');

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return null;
  return new Date(t).toISOString().slice(11, 16);
}

exports.listResources = async (req, res) => {
  try {
    const { category, building, status, search } = req.query;
    const where = {};

    if (category) where.category_id = parseInt(category);
    if (building) where.building_id = parseInt(building);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { resource_name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        resource_category: true,
        building: true,
        resource_feature_map: {
          include: { resource_feature: true },
        },
      },
      orderBy: { resource_name: 'asc' },
    });

    const result = resources.map((r) => ({
      resource_id: r.resource_id,
      resource_name: r.resource_name,
      category_id: r.category_id,
      category_name: r.resource_category?.category_name,
      building_id: r.building_id,
      building_name: r.building?.building_name || null,
      floor_number: r.floor_number,
      room_number: r.room_number,
      capacity: r.capacity,
      status: r.status,
      description: r.description,
      features: r.resource_feature_map.map((fm) => fm.resource_feature.feature_name),
    }));

    res.json(result);
  } catch (err) {
    console.error('List resources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
};

exports.getResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { resource_id: parseInt(id) },
      include: {
        resource_category: true,
        building: true,
        resource_feature_map: {
          include: { resource_feature: true },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    res.json({
      resource_id: resource.resource_id,
      resource_name: resource.resource_name,
      category_id: resource.category_id,
      category_name: resource.resource_category?.category_name,
      building_id: resource.building_id,
      building_name: resource.building?.building_name || null,
      floor_number: resource.floor_number,
      room_number: resource.room_number,
      capacity: resource.capacity,
      status: resource.status,
      description: resource.description,
      features: resource.resource_feature_map.map((fm) => fm.resource_feature.feature_name),
    });
  } catch (err) {
    console.error('Get resource error:', err);
    res.status(500).json({ error: 'Failed to fetch resource.' });
  }
};

exports.getResourceBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await prisma.booking.findMany({
      where: {
        resource_id: parseInt(id),
        booking_date: { gte: new Date() },
        booking_status: { in: ['Pending', 'Approved'] },
      },
      orderBy: { booking_date: 'asc' },
      take: 20,
      include: { user: { select: { name: true } } },
    });

    const result = bookings.map((b) => ({
      booking_id: b.booking_id,
      booked_by: b.user.name,
      booking_date: formatDate(b.booking_date),
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      booking_status: b.booking_status,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get resource bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch resource bookings.' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.resource_category.findMany({
      orderBy: { category_name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

exports.getFeatures = async (req, res) => {
  try {
    const features = await prisma.resource_feature.findMany({
      orderBy: { feature_name: 'asc' },
    });
    res.json(features);
  } catch (err) {
    console.error('Get features error:', err);
    res.status(500).json({ error: 'Failed to fetch features.' });
  }
};

exports.createResource = async (req, res) => {
  try {
    const {
      resource_name, category_id, building_id, floor_number,
      room_number, capacity, status, description, feature_ids,
    } = req.body;

    if (!resource_name || !category_id) {
      return res.status(400).json({ error: 'Resource name and category are required.' });
    }

    const resource = await prisma.resource.create({
      data: {
        resource_name,
        category_id: parseInt(category_id),
        building_id: building_id ? parseInt(building_id) : null,
        floor_number: floor_number ? parseInt(floor_number) : null,
        room_number: room_number || null,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || 'Available',
        description: description || null,
      },
      include: {
        resource_category: true,
        building: true,
        resource_feature_map: { include: { resource_feature: true } },
      },
    });

    if (feature_ids && feature_ids.length > 0) {
      await prisma.resource_feature_map.createMany({
        data: feature_ids.map((fid) => ({
          resource_id: resource.resource_id,
          feature_id: parseInt(fid),
        })),
      });
    }

    // Re-fetch with features included
    const result = await prisma.resource.findUnique({
      where: { resource_id: resource.resource_id },
      include: {
        resource_category: true,
        building: true,
        resource_feature_map: { include: { resource_feature: true } },
      },
    });

    res.status(201).json({
      resource_id: result.resource_id,
      resource_name: result.resource_name,
      category_id: result.category_id,
      category_name: result.resource_category?.category_name,
      building_id: result.building_id,
      building_name: result.building?.building_name || null,
      floor_number: result.floor_number,
      room_number: result.room_number,
      capacity: result.capacity,
      status: result.status,
      description: result.description,
      features: result.resource_feature_map.map((fm) => fm.resource_feature.feature_name),
    });
  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      resource_name, category_id, building_id, floor_number,
      room_number, capacity, status, description, feature_ids,
    } = req.body;

    const resourceId = parseInt(id);

    const existing = await prisma.resource.findUnique({ where: { resource_id: resourceId } });
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.resource.update({
        where: { resource_id: resourceId },
        data: {
          resource_name: resource_name ?? existing.resource_name,
          category_id: category_id ? parseInt(category_id) : existing.category_id,
          building_id: building_id !== undefined ? (building_id ? parseInt(building_id) : null) : existing.building_id,
          floor_number: floor_number !== undefined ? (floor_number ? parseInt(floor_number) : null) : existing.floor_number,
          room_number: room_number !== undefined ? (room_number || null) : existing.room_number,
          capacity: capacity !== undefined ? (capacity ? parseInt(capacity) : null) : existing.capacity,
          status: status || existing.status,
          description: description !== undefined ? (description || null) : existing.description,
        },
      });

      if (feature_ids !== undefined) {
        await tx.resource_feature_map.deleteMany({ where: { resource_id: resourceId } });
        if (feature_ids.length > 0) {
          await tx.resource_feature_map.createMany({
            data: feature_ids.map((fid) => ({
              resource_id: resourceId,
              feature_id: parseInt(fid),
            })),
          });
        }
      }

      return tx.resource.findUnique({
        where: { resource_id: resourceId },
        include: {
          resource_category: true,
          building: true,
          resource_feature_map: { include: { resource_feature: true } },
        },
      });
    });

    res.json({
      resource_id: result.resource_id,
      resource_name: result.resource_name,
      category_id: result.category_id,
      category_name: result.resource_category?.category_name,
      building_id: result.building_id,
      building_name: result.building?.building_name || null,
      floor_number: result.floor_number,
      room_number: result.room_number,
      capacity: result.capacity,
      status: result.status,
      description: result.description,
      features: result.resource_feature_map.map((fm) => fm.resource_feature.feature_name),
    });
  } catch (err) {
    console.error('Update resource error:', err);
    res.status(500).json({ error: 'Failed to update resource.' });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id);

    const existing = await prisma.resource.findUnique({ where: { resource_id: resourceId } });
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        resource_id: resourceId,
        booking_status: { in: ['Pending', 'Approved'] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete resource with active bookings (Pending or Approved). Cancel them first.',
      });
    }

    // Delete related records then the resource
    await prisma.$transaction(async (tx) => {
      await tx.resource_feature_map.deleteMany({ where: { resource_id: resourceId } });
      await tx.maintenance_log.deleteMany({ where: { resource_id: resourceId } });
      await tx.department_resource_access.deleteMany({ where: { resource_id: resourceId } });
      await tx.waitlist.deleteMany({ where: { resource_id: resourceId } });
      await tx.booking.deleteMany({ where: { resource_id: resourceId } });
      await tx.resource.delete({ where: { resource_id: resourceId } });
    });

    res.json({ message: 'Resource deleted successfully.' });
  } catch (err) {
    console.error('Delete resource error:', err);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
};
