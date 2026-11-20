// The standard page inside the shell: a large left-aligned title, an
// optional line under it (never a small label above it), and the content.
export default function PageFrame({ title, caption, actions, maxWidth = 'max-w-none', children }) {
  return (
    <div className={`px-4 pb-12 pt-6 tablet:px-6 tablet:pt-8 desktop:px-10 desktop:pt-12 ${maxWidth}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-display-sm text-ink hyphens-auto [overflow-wrap:break-word] desktop:t-display-md">{title}</h1>
          {caption && <p className="mt-2 text-ink-soft t-body-lg">{caption}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
