import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Edit,
  Trash2,
  Power,
  X
} from 'lucide-react';
import { customUrlService } from '../../../services/customUrlService';
import { postService } from '../../../services/postService';
import { WEBSITE_BASE_URL } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';
import DataTable, { type DataTableColumn } from '../../../components/shared/DataTable';
import Pagination from '../../../components/shared/Pagination';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import ErrorState from '../../../components/shared/ErrorState';
import type { CustomUrlItem, PaginationMeta, Post } from '../../../types';

function sanitizeSegment(value: string, separator: '-' | '_' = '-'): string {
  return value
    .trim()
    .replace(/\s+/g, separator)
    .replace(/[^A-Za-z0-9._-]/g, '');
}

const EMPTY_FORM = {
  post: '',
  country: 'USA',
  state: '',
  city: '',
  username: '',
  shortTitle: '',
  isActive: true
};

export default function CustomUrlsPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<CustomUrlItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomUrlItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const websiteOrigin = (WEBSITE_BASE_URL || 'https://privatedelights.ch').replace(/\/+$/, '');

  const loadUrls = useCallback(async () => {
    try {
      const res = await customUrlService.getCustomUrls({
        page,
        limit: 12,
        search: searchQuery || undefined,
        isActive: statusFilter || undefined
      });
      setItems(res.data || []);
      setMeta(res.meta || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom URLs.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadUrls();
    });
    return () => {
      active = false;
    };
  }, [loadUrls]);

  useEffect(() => {
    let active = true;
    postService
      .getPosts({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => {
        if (active) setPosts(res.data || []);
      })
      .catch(() => {
        // Non-blocking; dropdown will show empty state if posts fail
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectPost = (postId: string) => {
    const selected = posts.find((p) => p._id === postId);
    if (!selected || editingId) {
      setForm((prev) => ({ ...prev, post: postId }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      post: postId,
      country: sanitizeSegment(selected.location?.country || prev.country || 'USA', '-'),
      state: sanitizeSegment(selected.location?.state || prev.state || '', '-'),
      city: sanitizeSegment(selected.location?.city || prev.city || '', '-'),
      username: sanitizeSegment(selected.displayName || selected.slug || '', '_').toLowerCase()
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (item: CustomUrlItem) => {
    const postId = typeof item.post === 'string' ? item.post : item.post?._id || '';
    setEditingId(item._id);
    setForm({
      post: postId,
      country: item.country,
      state: item.state,
      city: item.city,
      username: item.username,
      shortTitle: item.shortTitle || '',
      isActive: item.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.post) {
      showToast('Please select a post profile.', 'error');
      return;
    }

    const payload = {
      post: form.post,
      country: sanitizeSegment(form.country, '-'),
      state: sanitizeSegment(form.state, '-'),
      city: sanitizeSegment(form.city, '-'),
      username: sanitizeSegment(form.username, '_'),
      shortTitle: form.shortTitle.trim(),
      isActive: form.isActive
    };

    if (!payload.country || !payload.state || !payload.city || !payload.username) {
      showToast('Country, State, City, and Username segments are all required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await customUrlService.updateCustomUrl(editingId, payload);
        showToast('Custom profile URL updated successfully.');
      } else {
        await customUrlService.createCustomUrl(payload);
        showToast('Custom profile URL created successfully.');
      }
      resetForm();
      void loadUrls();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save custom URL.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CustomUrlItem) => {
    try {
      await customUrlService.updateCustomUrl(item._id, { isActive: !item.isActive });
      showToast(`URL /${item.country}/${item.state}/${item.city}/${item.username} is now ${!item.isActive ? 'active' : 'disabled'}.`);
      void loadUrls();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleCopyUrl = async (item: CustomUrlItem) => {
    const fullUrl = `${websiteOrigin}/${item.country}/${item.state}/${item.city}/${item.username}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(item._id);
      showToast('Full profile URL copied to clipboard.');
      setTimeout(() => setCopiedId((prev) => (prev === item._id ? null : prev)), 2000);
    } catch {
      showToast('Could not copy URL automatically.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customUrlService.deleteCustomUrl(deleteTarget._id);
      showToast('Custom URL deleted.');
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      void loadUrls();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete custom URL.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const previewPath = `/${sanitizeSegment(form.country || 'USA', '-')}/${sanitizeSegment(form.state || 'California', '-')}/${sanitizeSegment(form.city || 'Norwalk', '-')}/${sanitizeSegment(form.username || 'miaa_snow', '_')}`;

  const columns: DataTableColumn<CustomUrlItem>[] = [
    {
      key: 'url',
      header: 'Custom URL',
      render: (item) => {
        const path = `/${item.country}/${item.state}/${item.city}/${item.username}`;
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-blue-400 break-all">{path}</span>
              <button
                type="button"
                onClick={() => void handleCopyUrl(item)}
                title="Copy full URL"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
              >
                {copiedId === item._id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
            {item.shortTitle && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                Short title: <span className="text-slate-200">{item.shortTitle}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'post',
      header: 'Linked Profile Post',
      render: (item) => {
        const post = typeof item.post === 'string' ? null : item.post;
        if (!post) {
          return <span className="text-xs text-slate-500">Post unavailable</span>;
        }
        return (
          <div className="flex items-center gap-2.5">
            <img
              src={post.mainImage || 'https://via.placeholder.com/40'}
              alt=""
              className="w-9 h-9 rounded-lg object-cover bg-slate-800 flex-shrink-0"
            />
            <div className="min-w-0">
              <Link
                to={`/admin/posts/${post._id}`}
                className="text-xs font-semibold text-white hover:text-blue-400 transition-colors block truncate max-w-[200px]"
              >
                {post.title}
              </Link>
              <div className="text-[11px] text-slate-400">@{post.displayName}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
            item.isActive
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {item.isActive ? 'Active' : 'Disabled'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => {
        const fullUrl = `${websiteOrigin}/${item.country}/${item.state}/${item.city}/${item.username}`;
        return (
          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleEdit(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Edit className="w-3.5 h-3.5" aria-hidden="true" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => void handleToggleActive(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Power className="w-3.5 h-3.5" aria-hidden="true" />
              {item.isActive ? 'Disable' : 'Enable'}
            </button>

            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              title="Open live custom URL"
              aria-label={`Open live page ${fullUrl}`}
              className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              aria-label="Delete custom URL"
              className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-6 h-6 text-blue-500" aria-hidden="true" />
          Custom Profile URLs
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure custom location-based profile URLs like{' '}
          <span className="font-mono text-slate-300">/USA/California/Norwalk/miaa_snow</span>. You
          can assign multiple URLs to any profile post.
        </p>
      </div>

      {/* Create / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">
            {editingId ? 'Edit Custom Profile URL' : 'Add New Custom Profile URL'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Profile Post *
            </label>
            <select
              required
              value={form.post}
              onChange={(e) => handleSelectPost(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a profile post...</option>
              {posts.map((post) => (
                <option key={post._id} value={post._id}>
                  {post.displayName} — {post.title} ({post.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Country *
            </label>
            <input
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="e.g. USA"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              State *
            </label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="e.g. California"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              City *
            </label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Norwalk"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username / Short Title Segment *
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. miaa_snow"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Short Title (Optional Page Title)
            </label>
            <input
              type="text"
              value={form.shortTitle}
              onChange={(e) => setForm({ ...form, shortTitle: e.target.value })}
              placeholder="e.g. Miaa Snow"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              URL Active
            </label>
          </div>
        </div>

        {/* Live URL Preview */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Live URL Preview
            </div>
            <div className="font-mono text-xs text-blue-400 break-all mt-0.5">
              {websiteOrigin}
              {previewPath}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold shadow-md transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {submitting
              ? 'Saving...'
              : editingId
              ? 'Update Custom URL'
              : 'Save Custom URL'}
          </button>
        </div>
      </form>

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
            placeholder="Search by country, state, city, username, or post..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          aria-label="Filter by URL status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadUrls} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          rowKey={(item) => item._id}
          loading={loading}
          caption="Custom profile URLs table"
          emptyTitle="No custom URLs configured yet"
          emptyDescription="Use the form above to map /Country/State/City/username paths to any profile post."
          footer={<Pagination meta={meta} onPageChange={setPage} />}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Custom URL?"
        description={`Are you sure you want to delete "/${deleteTarget?.country}/${deleteTarget?.state}/${deleteTarget?.city}/${deleteTarget?.username}"? The underlying profile post will remain untouched.`}
        confirmLabel="Delete URL"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
