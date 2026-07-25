import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

const links = [
  {
    to: '/admin/podcasts',
    title: 'Podcastlar',
    description: 'Seriya statusi, nashr va soft delete.',
  },
  {
    to: '/admin/books',
    title: 'Kitoblar',
    description: 'Kitob + bob matni, draft → nashr.',
  },
  {
    to: '/admin/research',
    title: 'Tadqiqot',
    description: 'Manbali maqolalar CMS.',
  },
  {
    to: '/admin/curriculum',
    title: 'O‘quv yo‘llari',
    description: 'Darslarni mavjud kontentga bog‘lash.',
  },
] as const;

export function AdminHomePage() {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-xl font-medium">Admin</h1>
        <p className="mt-1 text-sm text-nur-muted">
          Kontent nashri va huquqlar. Fake kontent qo‘shilmaydi.
        </p>
      </header>

      <ul className="divide-y divide-nur-line border-y border-nur-line">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="block py-4 hover:text-nur-accent">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-nur-muted">{item.description}</p>
            </Link>
          </li>
        ))}
        {role === 'admin' ? (
          <li>
            <Link to="/admin/users" className="block py-4 hover:text-nur-accent">
              <p className="font-medium">Foydalanuvchilar</p>
              <p className="mt-1 text-sm text-nur-muted">Rollar va faollik (faqat admin).</p>
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
