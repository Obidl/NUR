type DomainPlaceholderProps = {
  title: string;
  description: string;
};

export function DomainPlaceholder({ title, description }: DomainPlaceholderProps) {
  return (
    <section className="nur-page nur-fade-in">
      <h1 className="nur-page-title">{title}</h1>
      <p className="nur-page-lede">{description}</p>
    </section>
  );
}
