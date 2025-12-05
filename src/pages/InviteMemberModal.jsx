import { useState, useEffect } from 'react';
import { X, Mail, UserPlus, CheckSquare, Square, FolderKanban } from 'lucide-react';
import axios from 'axios';

export default function InviteMemberModal({ tenantId, tenantName, isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TENANT_USER');
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState('');

  // ✅ Cargar proyectos del tenant
  useEffect(() => {
    if (isOpen && tenantId) {
      loadProjects();
    }
    
    // Cleanup al cerrar
    if (!isOpen) {
      setEmail('');
      setRole('TENANT_USER');
      setSelectedProjects([]);
      setError('');
    }
  }, [isOpen, tenantId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8084/api/projects?tenantId=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProjects(response.data || []);
      console.log('✅ Projects loaded:', response.data);
    } catch (err) {
      console.error('❌ Error loading projects:', err);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = getUserId();
      const userEmail = getUserEmail();

      if (!userId || !userEmail) {
        setError('Authentication error: Please login again');
        setLoading(false);
        return;
      }

      console.log('📤 Sending invitation:', {
        email,
        role,
        tenantId,
        projectIds: selectedProjects,
        userId,
        userEmail
      });

      const response = await axios.post(
        `http://localhost:8083/api/tenants/${tenantId}/members/invite`,
        {
          email,
          role,
          projectIds: selectedProjects
        },
        {
          headers: {
            'X-User-Id': userId,
            'X-User-Email': userEmail,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Invitation sent:', response.data);

      // Success callback
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('❌ Error sending invitation:', err);
      console.error('Response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getUserId = () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      return null;
    }
  };

  const getUserEmail = () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || payload.sub;
    } catch (e) {
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invite Member</h2>
              <p className="text-sm text-gray-500">{tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="colleague@example.com"
                required
              />
            </div>
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            >
              <option value="TENANT_USER">Member</option>
              <option value="TENANT_ADMIN">Admin</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {role === 'TENANT_ADMIN' 
                ? '🔐 Full access to manage workspace and members' 
                : '👤 Can create and view projects'}
            </p>
          </div>

          {/* Project Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Project Access (Optional)
              </label>
              {projects.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllProjects}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FolderKanban className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No projects in this workspace yet</p>
                <p className="text-xs text-gray-500 mt-1">Create projects first to grant access</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      className="flex-shrink-0"
                    >
                      {selectedProjects.includes(project.id) ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-gray-500">{project.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className="mt-2 text-sm text-gray-500">
              💡 Selected projects: <strong>{selectedProjects.length}</strong>
              {selectedProjects.length > 0 && ' - User will be added as PROJECT_MEMBER'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Note:</strong> The invitation will expire in 7 days. The user will be added to the tenant
            {selectedProjects.length > 0 && ` and ${selectedProjects.length} selected project(s)`}.
          </p>
        </div>
      </div>
    </div>
  );
}