import { Button } from '@/shared/components/Button';

type Props = {
  status: string;
  onStatus: (status: 'draft' | 'in_review' | 'archived') => void;
  onPublish: () => void;
  onSoftDelete: () => void;
  busy?: boolean;
};

export function ContentWorkflowActions({
  status,
  onStatus,
  onPublish,
  onSoftDelete,
  busy,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onStatus('in_review')}>
          Tekshiruvga
        </Button>
      ) : null}
      {status === 'in_review' ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onStatus('draft')}>
          Draftga
        </Button>
      ) : null}
      {status === 'draft' || status === 'in_review' ? (
        <Button type="button" disabled={busy} onClick={onPublish}>
          Nashr
        </Button>
      ) : null}
      {status === 'published' ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onStatus('draft')}>
          Nashrdan olish
        </Button>
      ) : null}
      {status !== 'archived' ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onStatus('archived')}>
          Arxiv
        </Button>
      ) : (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onStatus('draft')}>
          Draftga qaytar
        </Button>
      )}
      <Button type="button" variant="ghost" disabled={busy} onClick={onSoftDelete}>
        O‘chirish
      </Button>
    </div>
  );
}
