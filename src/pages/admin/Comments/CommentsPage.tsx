import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Check, XCircle, Trash2, Eye, Sparkles } from 'lucide-react';
import { commentService } from '../../../services/commentService';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import DataTable, { type DataTableColumn } from '../../../components/shared/DataTable';
import Pagination from '../../../components/shared/Pagination';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import ErrorState from '../../../components/shared/ErrorState';
import type { CommentItem, PaginationMeta, Post } from '../../../types';

export default function CommentsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [postFilter, setPostFilter] = useState(searchParams.get('postId') || '');
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get('isApproved') || '');
  const [generatedFilter, setGeneratedFilter] = useState(searchParams.get('isGenerated') || '');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    postService
      .getPosts({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => setPosts(res.data || []))
      .catch(() => {
        // Non-blocking for post dropdown
      });
  }, []);

  const loadComments = useCallback(async () => {
    try {
      const res = await commentService.getComments({
        page,
        limit: 10,
        search: searchQuery || undefined,
        postId: postFilter || undefined,
        isApproved: approvalFilter === '' ? undefined : approvalFilter,
        isGenerated: generatedFilter === '' ? undefined : generatedFilter
      });
      setComments(res.data || []);
      setMeta(res.meta || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, postFilter, approvalFilter, generatedFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadComments();
    });
    return () => {
      active = false;
    };
  }, [loadComments]);

  const syncParams = (next: Record<string, string>) => {
    const updated = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) updated.set(k, v);
    });
    setSearchParams(updated, { replace: true });
  };

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setSearchQuery(trimmed);
    setPage(1);
    syncParams({
      search: trimmed,
      postId: postFilter,
      isApproved: approvalFilter,
      isGenerated: generatedFilter
    });
  };

  const handleApprove = async (id: string) => {
    try {
      await commentService.approveComment(id);
      showToast('Comment approved and published to the website.');
      void loadComments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve comment.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await commentService.rejectComment(id);
      showToast('Comment rejected / unpublished.');
      void loadComments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject comment.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await commentService.deleteComment(deleteTarget._id);
      showToast('Comment deleted permanently.');
      setDeleteTarget(null);
      void loadComments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete comment.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<CommentItem>[] = [
    {
      key: 'reviewer',
      header: 'Reviewer & Comment',
      render: (rev) => (
        <div className="space-y-1 max-w-md">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/admin/comments/${rev._id}`}
              className="font-semibold text-white hover:text-blue-400 transition-colors"
            >
              {rev.reviewerName}
            </Link>
            <span className="text-amber-400 text-xs font-semibold">★ {rev.rating}</span>
            {rev.isGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                AI / Demo Generated
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">"{rev.comment}"</p>
        </div>
      )
    },
    {
      key: 'post',
      header: 'Post',
      render: (rev) =>
        typeof rev.post === 'object' && rev.post !== null ? (
          <Link
            to={`/admin/posts/${rev.post._id}`}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 line-clamp-2"
          >
            {rev.post.title}
          </Link>
        ) : (
          <span className="text-xs text-slate-500">Unknown post</span>
        )
    },
    {
      key: 'status',
      header: 'Status',
      render: (rev) =>
        rev.isApproved ? (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Approved
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            Pending
          </span>
        )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (rev) => (
        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
          <Link
            to={`/admin/comments/${rev._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            View
          </Link>

          {!rev.isApproved ? (
            <button
              type="button"
              onClick={() => void handleApprove(rev._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Approve
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleReject(rev._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Reject
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeleteTarget(rev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Comments Moderation</h2>
          <p className="text-sm text-slate-400">
            Filter, approve, reject, and moderate user and generated comments
          </p>
        </div>
        <Link
          to="/admin/comment-generator"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Open Comment Generator
        </Link>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleApplySearch}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <div className="relative lg:col-span-2">
          <Search
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reviewer or comment text..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          aria-label="Filter by post"
          value={postFilter}
          onChange={(e) => {
            const val = e.target.value;
            setPostFilter(val);
            setPage(1);
            syncParams({
              search: searchQuery,
              postId: val,
              isApproved: approvalFilter,
              isGenerated: generatedFilter
            });
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Posts</option>
          {posts.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by approval status"
          value={approvalFilter}
          onChange={(e) => {
            const val = e.target.value;
            setApprovalFilter(val);
            setPage(1);
            syncParams({
              search: searchQuery,
              postId: postFilter,
              isApproved: val,
              isGenerated: generatedFilter
            });
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Approval States</option>
          <option value="false">Pending Approval</option>
          <option value="true">Approved</option>
        </select>

        <div className="flex gap-2">
          <select
            aria-label="Filter by source"
            value={generatedFilter}
            onChange={(e) => {
              const val = e.target.value;
              setGeneratedFilter(val);
              setPage(1);
              syncParams({
                search: searchQuery,
                postId: postFilter,
                isApproved: approvalFilter,
                isGenerated: val
              });
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Sources</option>
            <option value="true">Generated Only</option>
            <option value="false">Organic Only</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Go
          </button>
        </div>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={loadComments} />
      ) : (
        <DataTable
          columns={columns}
          data={comments}
          rowKey={(c) => c._id}
          loading={loading}
          caption="Comments moderation table"
          emptyTitle="No comments match your filters"
          emptyDescription="Try clearing the post or status filters to see more comments."
          footer={<Pagination meta={meta} onPageChange={setPage} />}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Comment?"
        description={`Are you sure you want to permanently delete the comment by "${deleteTarget?.reviewerName}"?`}
        confirmLabel="Delete Comment"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
