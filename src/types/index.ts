export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isBlock: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostImage {
  url: string;
  public_id?: string;
  caption?: string;
  order?: number;
  isMain?: boolean;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  displayName: string;
  category: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  height?: string;
  bodyType?: string;
  serviceType?: string[];
  mainImage: string;
  images: PostImage[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    formattedLocation?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  donations?: string;
  paymentMethods?: string[];
  attributes?: {
    eyes?: string;
    hair?: string;
    hairLength?: string;
    grooming?: string;
    chest?: string;
    piercings?: boolean;
    tattoos?: boolean;
    smoke?: boolean;
  };
  aboutSection?: {
    notice?: string;
    warnings?: string;
    noList?: string[];
  };
  scheduleSection?: {
    workingHours?: string;
    workingDays?: string[];
  };
  screeningSection?: {
    requirements?: string;
    depositRequired?: boolean;
    depositAmount?: string;
    instructions?: string;
  };
  status: 'published' | 'draft' | 'archived';
  averageRating: number;
  totalReviews: number;
  isFeatured?: boolean;
  customUrls?: string[];
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CommentItem {
  _id: string;
  post:
    | string
    | {
        _id: string;
        title: string;
        slug: string;
        displayName?: string;
      };
  user?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reviewerName: string;
  comment: string;
  rating: number;
  visitDate?: string;
  reviewerStats?: string;
  isVerifiedMember?: boolean;
  isGenerated: boolean;
  isApproved: boolean;
  providerResponse?: {
    text?: string;
    respondedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStatsData {
  stats: {
    posts: {
      total: number;
      published: number;
      draft: number;
      archived: number;
    };
    users: {
      total: number;
      active: number;
      blocked: number;
      admins: number;
    };
    comments: {
      total: number;
      approved: number;
      pending: number;
      generated: number;
    };
    ratings: {
      average: number;
    };
  };
  recentActivity: {
    recentPosts: Post[];
    pendingReviews: CommentItem[];
    recentUsers: User[];
  };
}

export interface DashboardAnalyticsData {
  categoryDistribution: { category: string; count: number }[];
  locationDistribution: { state: string; city: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
}

export interface ToastItem {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface CustomUrlItem {
  _id: string;
  post:
    | string
    | {
        _id: string;
        title: string;
        slug: string;
        displayName: string;
        mainImage?: string;
        status?: 'published' | 'draft' | 'archived';
        location?: {
          country?: string;
          state?: string;
          city?: string;
        };
      };
  country: string;
  state: string;
  city: string;
  username: string;
  normalizedPath: string;
  shortTitle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
