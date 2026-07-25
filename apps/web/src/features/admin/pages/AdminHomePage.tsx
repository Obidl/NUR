import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

const links = [
  {
    to: '/admin/videos',
    title: 'Videolar',
    description: 'YouTube embed (siyrat) — qayta host yo‘q.',
  },
  {
    to: '/admin/podcasts',
    title: 'Podcastlar',
    description: 'Seriya + epizod, audio URL, nashr.',
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
    <section className="nur-fade-in space-y-8">
      <header>
        <h1 className="nur-page-title">Admin</h1>
        <p className="nur-page-lede">
          Kontent nashri va huquqlar. Fake kontent qo‘shilmaydi.
        </p>
      </header>

      <ul className="nur-list">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="nur-list-row !items-start">
              <div>
                <p className="font-semibold tracking-[-0.01em]">{item.title}</p>
                <p className="mt-1 text-sm text-nur-muted">{item.description}</p>
              </div>
            </Link>
          </li>
        ))}
        {role === 'admin' ? (
          <li>
            <Link to="/admin/users" className="nur-list-row !items-start">
              <div>
                <p className="font-semibold tracking-[-0.01em]">Foydalanuvchilar</p>
                <p className="mt-1 text-sm text-nur-muted">Rollar va faollik (faqat admin).</p>
              </div>
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
