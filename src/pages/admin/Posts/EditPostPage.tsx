import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import PostForm from './components/PostForm';
import { postToFormValues } from './components/postFormHelpers';
import type { Post } from '../../../types';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const res = await postService.getPostById(id);
      setPost(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadPost();
    });
    return () => {
      active = false;
    };
  }, [loadPost]);

  const handleUpdate = async (payload: Record<string, unknown>) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await postService.updatePost(id, payload);
      showToast('Post updated and synced to website.');
      navigate(`/admin/posts/${id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading post for editing..." />;
  if (error || !post) return <ErrorState message={error || 'Post not found.'} onRetry={loadPost} />;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/admin/posts/${post._id}`}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Back to post details"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Edit Post</h2>
          <p className="text-sm text-slate-400">{post.title}</p>
        </div>
      </div>

      <PostForm
        initialValues={postToFormValues(post)}
        submitLabel="Update & Sync Post"
        submitting={submitting}
        onSubmit={handleUpdate}
        onCancel={() => navigate(`/admin/posts/${post._id}`)}
      />
    </div>
  );
}
