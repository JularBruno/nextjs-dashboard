import DashboardSkeleton from '@/app/ui/skeletons';
 // Since loading.tsx was a level higher than /invoices/page.tsx and /customers/page.tsx in the file system, it's also applied to those pages.
// Route groups allow you to organize files into logical groups without affecting the URL path structure. When you create a new folder using parentheses (), the name won't be included in the URL path. So /dashboard/(overview)/page.tsx becomes /dashboard.

export default function Loading() {
  return <DashboardSkeleton />;
}