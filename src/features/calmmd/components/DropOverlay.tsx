type DropOverlayProps = {
  active: boolean;
};

export default function DropOverlay({ active }: DropOverlayProps) {
  return (
    <div className={`drop-overlay${active ? " is-active" : ""}`}>
      <div className="drop-overlay__card">
        <span className="drop-overlay__eyebrow">轻轻放下就好</span>
        <strong>把 Markdown 文稿拖进来，CalmMD 会马上把它排好。</strong>
      </div>
    </div>
  );
}
