export const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  users: 'Users',
  posts: 'Posts',
  create: 'Create Post',
  edit: 'Edit Post',
  comments: 'Comments',
  'comment-generator': 'Comment Generator',
  profile: 'Profile',
  settings: 'Settings'
};

export function getPageTitleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return 'Dashboard Overview';

  const last = segments[segments.length - 1];
  const prev = segments[segments.length - 2];

  if (last === 'dashboard') return 'Dashboard Overview';
  if (last === 'create' && prev === 'posts') return 'Create Post';
  if (last === 'edit' && segments.includes('posts')) return 'Edit Post';
  if (prev === 'users' && last !== 'users') return 'User Details';
  if (prev === 'posts' && last !== 'posts' && last !== 'create') return 'Post Details';
  if (prev === 'comments' && last !== 'comments') return 'Comment Details';

  return SEGMENT_LABELS[last] || 'Admin Dashboard';
}
