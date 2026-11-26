import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Archive, Globe, Trash2, ExternalLink } from 'lucide-react';
import { postService } from '../../../services/postService';
import { buildWebsiteUrl } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';
import DataTable, { type DataTableColumn } from '../../../components/shared/DataTable';
import Pagination from '../../../components/shared/Pagination';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import ErrorState from '../../../components/shared/ErrorState';
import type { PaginationMeta, Post } from '../../../types';

export default function PostsPage() {
  const { showToast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await postService.getPosts({
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: searchQuery || undefined,
        status: statusFilter || undefined
      });
      setPosts(res.data || []);
      setMeta(res.meta || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadPosts();
    });
    return () => {
      active = false;
    };
  }, [loadPosts]);

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      if (post.status === 'published') {
        await postService.archivePost(post._id);
        showToast(`"${post.title}" has been unpublished (archived).`);
      } else {
        await postService.publishPost(post._id);
        showToast(`"${post.title}" is now published live.`);
      }
      void loadPosts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update post status.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await postService.deletePost(deleteTarget._id);
      showToast(`Post "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      void loadPosts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete post.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Post>[] = [
    {
      key: 'profile',
      header: 'Profile',
      render: (post) => (
        <div className="flex items-center gap-3">
          <img
            src={post.mainImage || 'https://via.placeholder.com/48'}
            alt=""
            className="w-11 h-11 rounded-lg object-cover bg-slate-800 flex-shrink-0"
          />
          <div className="min-w-0">
            <Link
              to={`/admin/posts/${post._id}`}
              className="font-semibold text-white hover:text-blue-400 transition-colors block truncate max-w-[240px]"
            >
              {post.title}
            </Link>
            <div className="text-xs text-blue-400">@{post.displayName}</div>
            <div className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">
              {post.customUrls?.[0] || (
                <Link to="/admin/custom-urls" className="text-slate-400 hover:text-blue-400">
                  Set custom URL →
                </Link>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (post) => (
        <div>
          <div className="text-xs text-slate-200">
            {post.location?.city || '—'}, {post.location?.state || '—'}
          </div>
          <div className="text-[11px] text-slate-500">{post.location?.country || 'USA'}</div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (post) => (
        <div>
          <div className="text-amber-400 font-semibold text-xs">★ {post.averageRating}</div>
          <div className="text-[11px] text-slate-500">{post.totalReviews} reviews</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (post) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
            post.status === 'published'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : post.status === 'draft'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {post.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (post) => (
        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
          <Link
            to={`/admin/posts/${post._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Details
          </Link>

          <Link
            to={`/admin/posts/${post._id}/edit`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Edit className="w-3.5 h-3.5" aria-hidden="true" />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => void handleTogglePublish(post)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {post.status === 'published' ? (
              <>
                <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                Publish
              </>
            )}
          </button>

          {post.customUrls?.[0] ? (
            <a
              href={buildWebsiteUrl(post.customUrls[0])}
              target="_blank"
              rel="noreferrer"
              title="Open live page"
              aria-label={`Open live page for ${post.title}`}
              className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          ) : (
            <Link
              to="/admin/custom-urls"
              title="Configure custom URL"
              aria-label={`Configure custom URL for ${post.title}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setDeleteTarget(post)}
            aria-label={`Delete ${post.title}`}
            className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Posts Management</h2>
          <p className="text-sm text-slate-400">
            Create, edit, publish/unpublish, and manage profile listings
          </p>
        </div>
        <Link
          to="/admin/posts/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Create New Post
        </Link>
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
            placeholder="Search by title, handle, city, or state..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

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
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={loadPosts} />
      ) : (
        <DataTable
          columns={columns}
          data={posts}
          rowKey={(p) => p._id}
          loading={loading}
          caption="Posts management table"
          emptyTitle="No posts found"
          emptyDescription="Create your first post or adjust your search filters."
          emptyAction={
            <Link
              to="/admin/posts/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Create New Post
            </Link>
          }
          footer={<Pagination meta={meta} onPageChange={setPage} />}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Post?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? All associated comments for this post will also be permanently removed.`}
        confirmLabel="Delete Post"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
