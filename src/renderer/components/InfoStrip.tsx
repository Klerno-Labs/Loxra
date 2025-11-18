export function InfoStrip({
  title,
  body,
  onDismiss
}: {
  title: string;
  body: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="info-strip">
      <div className="info-icon text-xs font-semibold text-slate-100">i</div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </div>
      {onDismiss && (
        <button className="btn btn-ghost btn-sm ml-auto" onClick={onDismiss}>
          Hide
        </button>
      )}
    </div>
  );
}
