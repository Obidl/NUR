import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/app/layouts/RootLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { HomePage } from '@/features/home/pages/HomePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { SettingsPage } from '@/features/profile/pages/SettingsPage';
import { SurahListPage } from '@/features/quran/pages/SurahListPage';
import { SurahReaderPage } from '@/features/quran/pages/SurahReaderPage';
import { PodcastSeriesListPage } from '@/features/podcasts/pages/PodcastSeriesListPage';
import { PodcastSeriesDetailPage } from '@/features/podcasts/pages/PodcastSeriesDetailPage';
import { BookCatalogPage } from '@/features/books/pages/BookCatalogPage';
import { BookDetailPage } from '@/features/books/pages/BookDetailPage';
import { BookChapterReaderPage } from '@/features/books/pages/BookChapterReaderPage';
import { ResearchListPage } from '@/features/research/pages/ResearchListPage';
import { ResearchDetailPage } from '@/features/research/pages/ResearchDetailPage';
import { CurriculumListPage } from '@/features/curriculum/pages/CurriculumListPage';
import { CurriculumDetailPage } from '@/features/curriculum/pages/CurriculumDetailPage';
import { RoleRoute } from '@/features/auth/components/RoleRoute';
import { LibraryPage } from '@/features/library/pages/LibraryPage';
import { SearchPage } from '@/features/search/pages/SearchPage';

const AdminHomePage = lazy(() =>
  import('@/features/admin/pages/AdminHomePage').then((m) => ({ default: m.AdminHomePage })),
);
const AdminPodcastsPage = lazy(() =>
  import('@/features/admin/pages/AdminPodcastsPage').then((m) => ({
    default: m.AdminPodcastsPage,
  })),
);
const AdminBooksPage = lazy(() =>
  import('@/features/admin/pages/AdminBooksPage').then((m) => ({ default: m.AdminBooksPage })),
);
const AdminUsersPage = lazy(() =>
  import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminResearchPage = lazy(() =>
  import('@/features/research/pages/AdminResearchPage').then((m) => ({
    default: m.AdminResearchPage,
  })),
);
const AdminCurriculumPage = lazy(() =>
  import('@/features/curriculum/pages/AdminCurriculumPage').then((m) => ({
    default: m.AdminCurriculumPage,
  })),
);

function AdminSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-nur-muted">
          Yuklanmoqda…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'quran', element: <SurahListPage /> },
      { path: 'quran/:surahNumber', element: <SurahReaderPage /> },
      { path: 'podcasts', element: <PodcastSeriesListPage /> },
      { path: 'podcasts/:slug', element: <PodcastSeriesDetailPage /> },
      { path: 'books', element: <BookCatalogPage /> },
      { path: 'books/:slug', element: <BookDetailPage /> },
      { path: 'books/:slug/:chapterSlug', element: <BookChapterReaderPage /> },
      { path: 'research', element: <ResearchListPage /> },
      { path: 'research/:slug', element: <ResearchDetailPage /> },
      { path: 'curriculum', element: <CurriculumListPage /> },
      { path: 'curriculum/:slug', element: <CurriculumDetailPage /> },
      { path: 'search', element: <SearchPage /> },
      {
        path: 'library',
        element: (
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        ),
      },
    ],
  },
  {
    path: 'admin',
    element: (
      <RoleRoute roles={['editor', 'admin']}>
        <AdminLayout />
      </RoleRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <AdminSuspense>
            <AdminHomePage />
          </AdminSuspense>
        ),
      },
      {
        path: 'podcasts',
        element: (
          <AdminSuspense>
            <AdminPodcastsPage />
          </AdminSuspense>
        ),
      },
      {
        path: 'books',
        element: (
          <AdminSuspense>
            <AdminBooksPage />
          </AdminSuspense>
        ),
      },
      {
        path: 'research',
        element: (
          <AdminSuspense>
            <AdminResearchPage />
          </AdminSuspense>
        ),
      },
      {
        path: 'curriculum',
        element: (
          <AdminSuspense>
            <AdminCurriculumPage />
          </AdminSuspense>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleRoute roles={['admin']}>
            <AdminSuspense>
              <AdminUsersPage />
            </AdminSuspense>
          </RoleRoute>
        ),
      },
    ],
  },
]);
