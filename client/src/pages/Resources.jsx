import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineBuildingOffice2, HiOutlineUserGroup, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';

const emptyForm = {
  resource_name: '',
  category_id: '',
  building_id: '',
  floor_number: '',
  room_number: '',
  capacity: '',
  status: 'Available',
  description: '',
  feature_ids: [],
};

export default function Resources() {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // CRUD state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchResources();
    api.get('/resources/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/buildings').then(res => setBuildings(res.data)).catch(() => {});
    api.get('/resources/features').then(res => setFeatures(res.data)).catch(() => {});
  }, []);

  const fetchResources = () => {
    setLoading(true);
    api.get('/resources')
      .then(res => setResources(res.data))
      .catch(() => toast.error('Failed to load resources'))
      .finally(() => setLoading(false));
  };

  const openDetail = (resource) => {
    setSelectedResource(resource);
    setModalLoading(true);
    api.get(`/resources/${resource.resource_id}/bookings`)
      .then(res => setUpcomingBookings(res.data))
      .catch(() => setUpcomingBookings([]))
      .finally(() => setModalLoading(false));
  };

  const openCreateForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (e, resource) => {
    e.stopPropagation();
    // Map feature names back to feature_ids
    const featureIds = features
      .filter(f => {
        const rFeatures = typeof resource.features === 'string' ? resource.features.split(',').map(s => s.trim()) : (resource.features || []);
        return rFeatures.includes(f.feature_name);
      })
      .map(f => f.feature_id);

    setFormData({
      resource_name: resource.resource_name || '',
      category_id: resource.category_id || '',
      building_id: resource.building_id || '',
      floor_number: resource.floor_number || '',
      room_number: resource.room_number || '',
      capacity: resource.capacity || '',
      status: resource.status || 'Available',
      description: resource.description || '',
      feature_ids: featureIds,
    });
    setEditingId(resource.resource_id);
    setShowForm(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (featureId) => {
    setFormData(prev => ({
      ...prev,
      feature_ids: prev.feature_ids.includes(featureId)
        ? prev.feature_ids.filter(id => id !== featureId)
        : [...prev.feature_ids, featureId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resource_name.trim() || !formData.category_id) {
      toast.error('Resource name and category are required.');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        building_id: formData.building_id ? parseInt(formData.building_id) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };
      if (editingId) {
        await api.put(`/resources/${editingId}`, payload);
        toast.success('Resource updated successfully.');
      } else {
        await api.post('/resources', payload);
        toast.success('Resource created successfully.');
      }
      setShowForm(false);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save resource.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      await api.delete(`/resources/${resourceId}`);
      toast.success('Resource deleted successfully.');
      setDeleteConfirm(null);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete resource.');
    }
  };

  const filtered = resources.filter(r => {
    if (search && !r.resource_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && r.category_name !== categoryFilter) return false;
    if (buildingFilter && r.building_name !== buildingFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const statusBadge = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-700',
      Booked: 'bg-yellow-100 text-yellow-700',
      'Under Maintenance': 'bg-red-100 text-red-700',
      Under_Maintenance: 'bg-red-100 text-red-700',
      Retired: 'bg-gray-200 text-gray-600',
    };
    const label = status === 'Under_Maintenance' ? 'Under Maintenance' : status;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{label}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        {isAdmin && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Resource
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.category_id || c} value={c.category_name || c}>{c.category_name || c}</option>)}
          </select>
          <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.building_id || b} value={b.building_name || b}>{b.building_name || b}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Booked">Booked</option>
            <option value="Under_Maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No resources found matching your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(r => (
            <div
              key={r.resource_id}
              onClick={() => openDetail(r)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow relative"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{r.resource_name}</h3>
                {statusBadge(r.status)}
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <p>Category: {r.category_name}</p>
                <div className="flex items-center gap-1">
                  <HiOutlineBuildingOffice2 className="w-4 h-4" />
                  <span>{r.building_name} - Room {r.room_number}</span>
                </div>
                {r.capacity && (
                  <div className="flex items-center gap-1">
                    <HiOutlineUserGroup className="w-4 h-4" />
                    <span>Capacity: {r.capacity}</span>
                  </div>
                )}
              </div>
              {r.features && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(typeof r.features === 'string' ? r.features.split(',') : r.features).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{typeof f === 'string' ? f.trim() : f}</span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => openEditForm(e, r)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r.resource_id); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{selectedResource.resource_name}</h2>
              <button onClick={() => setSelectedResource(null)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Category:</span> <span className="font-medium">{selectedResource.category_name}</span></div>
                <div><span className="text-gray-500">Status:</span> {statusBadge(selectedResource.status)}</div>
                <div><span className="text-gray-500">Building:</span> <span className="font-medium">{selectedResource.building_name}</span></div>
                <div><span className="text-gray-500">Room:</span> <span className="font-medium">{selectedResource.room_number}</span></div>
                {selectedResource.capacity && <div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{selectedResource.capacity}</span></div>}
                {selectedResource.floor_number && <div><span className="text-gray-500">Floor:</span> <span className="font-medium">{selectedResource.floor_number}</span></div>}
              </div>
              {selectedResource.description && <p className="text-gray-600">{selectedResource.description}</p>}
              {selectedResource.features && (
                <div className="flex flex-wrap gap-1.5">
                  {(typeof selectedResource.features === 'string' ? selectedResource.features.split(',') : selectedResource.features).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{typeof f === 'string' ? f.trim() : f}</span>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Upcoming Bookings</h3>
                {modalLoading ? (
                  <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                ) : upcomingBookings.length === 0 ? (
                  <p className="text-gray-500">No upcoming bookings.</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingBookings.map((b, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{new Date(b.booking_date).toLocaleDateString()}</p>
                          <p className="text-gray-500">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.booking_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.booking_status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name *</label>
                <input
                  type="text"
                  value={formData.resource_name}
                  onChange={e => handleFormChange('resource_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => handleFormChange('category_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                  <select
                    value={formData.building_id}
                    onChange={e => handleFormChange('building_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  >
                    <option value="">Select building</option>
                    {buildings.map(b => <option key={b.building_id} value={b.building_id}>{b.building_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input
                    type="number"
                    value={formData.floor_number}
                    onChange={e => handleFormChange('floor_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={e => handleFormChange('room_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => handleFormChange('capacity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                >
                  <option value="Available">Available</option>
                  <option value="Under_Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
                />
              </div>

              {features.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map(f => (
                      <label key={f.feature_id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.feature_ids.includes(f.feature_id)}
                          onChange={() => toggleFeature(f.feature_id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        {f.feature_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : (editingId ? 'Update Resource' : 'Create Resource')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Resource</h3>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this resource? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
