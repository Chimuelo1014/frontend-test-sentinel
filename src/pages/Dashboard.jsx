import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI } from '../services/api';
import {
  LogOut,
  Building2,
  Users,
  FolderKanban,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  UserPlus,
  X,
  Check,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadTenants(),
      loadInvitations()
    ]);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await tenantAPI.getMyTenants(user.userId);
      setTenants(response.data);
    } catch (err) {
      console.error('❌ Error loading tenants:', err);
      setError(err.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await tenantAPI.getPendingInvitations(user.email);
      setInvitations(response.data);
      console.log('✅ Invitations loaded:', response.data);
    } catch (err) {
      console.error('❌ Error loading invitations:', err);
    }
  };

  const handleInvite = (tenant) => {
    setSelectedTenant(tenant);
    setShowInviteModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <InvitationsSection 
            invitations={invitations} 
            onAccept={() => loadData()}
            onReject={() => loadData()}
          />
        )}

        {/* Success Alert */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900">
              ✅ Authentication Working!
            </p>
            <p className="text-sm text-green-700 mt-1">
              User ID: <code className="bg-green-100 px-1 py-0.5 rounded">{user?.userId}</code>
            </p>
          </div>
        </div>

        {/* Tenants Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Workspaces</h2>
              <p className="text-sm text-gray-600 mt-1">
                Tenants you own or are member of
              </p>
            </div>
            <button
              onClick={loadTenants}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error loading tenants</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={loadTenants}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tenants found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <TenantCard 
                    key={tenant.id} 
                    tenant={tenant}
                    onInvite={() => handleInvite(tenant)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          tenant={selectedTenant}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadTenants();
          }}
        />
      )}
    </div>
  );
}

function InvitationsSection({ invitations, onAccept, onReject }) {
  const { user } = useAuth();

  const handleAccept = async (token) => {
    try {
      await tenantAPI.acceptInvitation(token, user.userId);
      onAccept();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  const handleReject = async (token) => {
    try {
      await tenantAPI.rejectInvitation(token, user.userId);
      onReject();
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('Failed to reject invitation');
    }
  };

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Invitations ({invitations.length})
          </h3>
          <p className="text-sm text-gray-600">You've been invited to join workspaces</p>
        </div>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white border border-blue-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-900">{invitation.tenantName}</p>
              <p className="text-sm text-gray-600">
                Invited by <span className="font-medium">{invitation.invitedByEmail}</span>
                {' '}as <span className="font-medium">{invitation.role}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(invitation.invitationToken)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleReject(invitation.invitationToken)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TenantCard({ tenant, onInvite }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
            <p className="text-sm text-gray-500 mt-1">/{tenant.slug}</p>

            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {tenant.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {tenant.plan} Plan
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatItem
          icon={<Users className="w-4 h-4" />}
          label="Users"
          current={tenant.usage?.currentUsers || 0}
          max={tenant.limits?.maxUsers || 0}
        />
        <StatItem
          icon={<FolderKanban className="w-4 h-4" />}
          label="Projects"
          current={tenant.usage?.currentProjects || 0}
          max={tenant.limits?.maxProjects || 0}
        />
        <StatItem
          icon={<Globe className="w-4 h-4" />}
          label="Domains"
          current={tenant.usage?.currentDomains || 0}
          max={tenant.limits?.maxDomains || 0}
        />
      </div>
    </div>
  );
}

function StatItem({ icon, label, current, max }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">
        {current}/{max === -1 ? '∞' : max}
      </p>
    </div>
  );
}

function InviteModal({ tenant, onClose, onSuccess }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TENANT_USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tenantAPI.inviteMember(tenant.id, user.userId, { email, role });
      alert('Invitation sent successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error inviting member:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Invite Member</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Invite someone to join <span className="font-medium">{tenant.name}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TENANT_USER">Member</option>
              <option value="TENANT_ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}