import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { userService } from '../../../services/userService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import DataTable, { type DataTableColumn } from '../../../components/shared/DataTable';
import Pagination from '../../../components/shared/Pagination';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import ErrorState from '../../../components/shared/ErrorState';
import type { PaginationMeta, User } from '../../../types';

export default function UsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await userService.getUsers({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        isBlock: statusFilter === '' ? undefined : statusFilter,
        page,
        limit: 10
      });
      setUsers(res.data || []);
      setMeta(res.meta || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, page]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadUsers();
    });
    return () => {
      active = false;
    };
  }, [loadUsers]);

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleToggleBlock = async (u: User) => {
    try {
      if (u.isBlock) {
        await userService.unblockUser(u._id);
        showToast(`${u.name} has been unblocked.`);
      } else {
        await userService.blockUser(u._id);
        showToast(`${u.name} has been blocked.`);
      }
      void loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user status.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.deleteUser(deleteTarget._id);
      showToast(`User "${deleteTarget.name}" deleted permanently.`);
      setDeleteTarget(null);
      void loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div>
          <Link
            to={`/admin/users/${u._id}`}
            className="font-semibold text-white hover:text-blue-400 transition-colors"
          >
            {u.name}
          </Link>
          <div className="text-xs text-slate-400">{u.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
            u.role === 'admin'
              ? 'bg-purple-950 text-purple-300 border border-purple-800'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {u.role}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            u.isBlock
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}
        >
          {u.isBlock ? 'Blocked' : 'Active'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span className="text-xs text-slate-400">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => {
        const isSelf = currentUser?._id === u._id;
        return (
          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
            <Link
              to={`/admin/users/${u._id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Details
            </Link>

            {u.role !== 'admin' && !isSelf && (
              <>
                <button
                  type="button"
                  onClick={() => void handleToggleBlock(u)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    u.isBlock
                      ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800'
                  }`}
                >
                  {u.isBlock ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                      Block
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(u)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Delete
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Users Management</h2>
        <p className="text-sm text-slate-400">
          Search, inspect, block/unblock, and manage registered user accounts
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleApplySearch}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          rowKey={(u) => u._id}
          loading={loading}
          caption="Registered users table"
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search term or role filter."
          footer={<Pagination meta={meta} onPageChange={setPage} />}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User Account?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmLabel="Delete User"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
