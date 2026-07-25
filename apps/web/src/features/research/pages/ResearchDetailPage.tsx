import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import {
  createResearchBookmark,
  deleteResearchBookmark,
  fetchResearchArticle,
  fetchResearchBookmarks,
} from '@/features/research/api/researchApi';
import { renderSafeResearchHtml } from '@/features/research/lib/safeRender';
import type {
  ResearchArticle,
  ResearchBookmark,
  ResearchCard,
} from '@/features/research/types/research.types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/Button';
import { DetailBackLink } from '@/shared/components/DetailBackLink';
import { DetailLoading } from '@/shared/components/DetailLoading';
import { ErrorState } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/lib/errors';

const SOURCE_TYPE_LABEL: Record<string, string> = {
  book: 'Kitob',
  article: 'Maqola',
  scholar: 'Olim',
  quran: 'Qur’on',
  hadith_collection: 'Hadis to‘plami',
  other: 'Boshqa',
};

export function ResearchDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { toast } = useToast();

  const [article, setArticle] = useState<ResearchArticle | null>(null);
  const [related, setRelated] = useState<ResearchCard[]>([]);
  const [rightsNote, setRightsNote] = useState<string | null>(null);
  const [bookmark, setBookmark] = useState<ResearchBookmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchResearchArticle(slug);
        if (cancelled) return;
        setArticle(detail.article);
        setRelated(detail.related ?? []);
        setRightsNote(detail.rights.licenseNotes);

        if (accessToken) {
          const marks = await fetchResearchBookmarks();
          if (!cancelled) {
            setBookmark(marks.find((m) => m.articleId === detail.article.id) ?? null);
          }
        } else {
          setBookmark(null);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Maqola topilmadi'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, accessToken]);

  const safeHtml = useMemo(() => {
    if (!article) return '';
    return renderSafeResearchHtml(article.body, article.bodyFormat);
  }, [article]);

  async function toggleBookmark() {
    if (!article) return;
    if (!accessToken) {
      navigate('/login', { state: { from: `/research/${slug}` } });
      return;
    }
    try {
      if (bookmark) {
        await deleteResearchBookmark(bookmark.id);
        setBookmark(null);
        toast('Xatcho‘p olib tashlandi', 'info');
      } else {
        const created = await createResearchBookmark(article.id);
        setBookmark(created);
        toast('Xatcho‘p saqlandi', 'success');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Xatcho‘p saqlanmadi'));
    }
  }

  if (loading) return <DetailLoading />;

  if (error || !article) {
    return (
      <section className="nur-page">
        <ErrorState message={error ?? 'Topilmadi'} />
        <Button to="/research" variant="secondary" className="mt-4">
          Orqaga
        </Button>
      </section>
    );
  }

  return (
    <article className="nur-page nur-fade-in">
      <div className="flex items-start justify-between gap-4">
        <DetailBackLink to="/research">Tadqiqot</DetailBackLink>
        <button
          type="button"
          onClick={() => void toggleBookmark()}
          className="inline-flex items-center gap-2 rounded-[var(--radius-m)] px-3 py-2 text-sm font-medium text-nur-muted transition-colors duration-200 hover:bg-nur-sunken hover:text-nur-ink"
          aria-label={bookmark ? 'Xatcho‘pni olib tashlash' : 'Xatcho‘p qo‘shish'}
        >
          {bookmark ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {bookmark ? 'Saqlangan' : 'Saqlash'}
        </button>
      </div>

      <header className="mt-8">
        <p className="text-[11px] font-medium uppercase tracking-wide text-nur-faint">
          {article.category}
        </p>
        <h1 className="mt-3 nur-page-title !text-[1.5rem] leading-snug md:!text-[1.75rem]">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-nur-muted">{article.authors.join(', ')}</p>
        {article.reviewer ? (
          <p className="mt-1 text-xs text-nur-faint">Tekshiruvchi: {article.reviewer}</p>
        ) : null}
        <p className="mt-5 text-sm leading-7 text-nur-muted">{article.summary}</p>
      </header>

      <div
        className="prose-nur mt-10 text-sm leading-7 [&_a]:text-nur-accent [&_blockquote]:border-l [&_blockquote]:border-nur-line [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      <section className="nur-surface mt-12 px-5 py-6 md:px-6">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">Manbalar</h2>
        <p className="mt-1 text-xs text-nur-faint">
          Har bir da’vo manbaga tayangan. Manbasiz maqola nashr qilinmaydi.
        </p>
        <ul className="mt-5 space-y-5">
          {article.sources.map((source, index) => (
            <li key={`${source.title}-${index}`} className="text-sm">
              <p className="font-semibold">
                {source.title}
                <span className="ml-2 text-xs font-normal text-nur-faint">
                  {SOURCE_TYPE_LABEL[source.type] ?? source.type}
                </span>
              </p>
              <p className="mt-1 text-nur-muted">{source.citation}</p>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-nur-accent hover:underline"
                >
                  Havola
                </a>
              ) : null}
              {source.notes ? (
                <p className="mt-1 text-xs text-nur-faint">{source.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
        {rightsNote ? <p className="mt-6 text-xs text-nur-faint">{rightsNote}</p> : null}
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="nur-section-title mb-3">O‘xshash maqolalar</h2>
          <ul className="nur-list">
            {related.map((item) => (
              <li key={item.id}>
                <Link to={`/research/${item.slug}`} className="nur-list-row !items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-[-0.01em]">{item.title}</p>
                    <p className="mt-1 text-sm text-nur-muted line-clamp-2">{item.summary}</p>
                    <p className="mt-1 text-xs text-nur-faint">{item.category}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
