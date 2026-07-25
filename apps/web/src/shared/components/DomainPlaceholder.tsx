type DomainPlaceholderProps = {
  title: string;
  description: string;
};

export function DomainPlaceholder({ title, description }: DomainPlaceholderProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-2xl font-medium text-nur-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-nur-muted">{description}</p>
    </section>
  );
}
