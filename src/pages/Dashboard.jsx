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
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ FIX: Solo cargar tenants una vez cuando el componente monta
  useEffect(() => {
    if (user?.userId) {
      loadTenants();
    }
  }, []); // ← Dependencias vacías, solo se ejecuta al montar

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ user.userId está disponible desde el contexto
      const response = await tenantAPI.getMyTenants(user.userId);
      setTenants(response.data);
      
      console.log('✅ Tenants loaded:', response.data);
    } catch (err) {
      console.error('❌ Error loading tenants:', err);
      setError(err.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
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
              <h2 className="text-lg font-semibold text-gray-900">Your Workspaces (Tenants)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Auto-created by tenant-service via RabbitMQ
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
                <p className="text-sm text-gray-500 mt-1">
                  🔄 Check RabbitMQ logs - Tenant should auto-create
                </p>
                <button
                  onClick={loadTenants}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Refresh Tenants
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <TenantCard key={tenant.id} tenant={tenant} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service Status */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title="Auth Service"
            status="online"
            description="✅ Authentication working"
            port="8081"
          />
          <StatusCard
            title="Tenant Service"
            status={tenants.length > 0 ? 'online' : 'checking'}
            description={tenants.length > 0 ? '✅ Tenant created' : '⏳ Waiting for tenant...'}
            port="8082"
          />
          <StatusCard
            title="RabbitMQ"
            status={tenants.length > 0 ? 'online' : 'unknown'}
            description={tenants.length > 0 ? '✅ Events flowing' : '⚠️ Check connection'}
            port="5672"
          />
        </div>
      </main>
    </div>
  );
}

function TenantCard({ tenant }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition">
      <div className="flex items-start justify-between">
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {tenant.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
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

function StatusCard({ title, status, description, port }) {
  const statusColors = {
    online: 'bg-green-100 text-green-800 border-green-200',
    offline: 'bg-red-100 text-red-800 border-red-200',
    checking: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-500 mt-2">Port: {port}</p>
    </div>
  );
}