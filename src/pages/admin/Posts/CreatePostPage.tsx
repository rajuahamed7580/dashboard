import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import PostForm from './components/PostForm';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (payload: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await postService.createPost(payload);
      showToast('New post created and published!');
      navigate(`/admin/posts/${res.data._id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/posts"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Back to posts"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Create New Post</h2>
          <p className="text-sm text-slate-400">
            Configure profile details, images, schedule, and screening rules
          </p>
        </div>
      </div>

      <PostForm
        submitLabel="Create & Publish Post"
        submitting={submitting}
        onSubmit={handleCreate}
        onCancel={() => navigate('/admin/posts')}
      />
    </div>
  );
}
