type ReadingProgressProps = {
  progressPercent: number;
  className?: string;
};

export default function ReadingProgress({
  progressPercent,
  className,
}: ReadingProgressProps) {
  return (
    <section
      className={`reading-progress${className ? ` ${className}` : ""}`}
      aria-label={`阅读进度 ${progressPercent}%`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPercent}
    >
      <div className="reading-progress__track" aria-hidden="true">
        <span
          className="reading-progress__fill"
          style={{ width: `${Math.max(progressPercent, 0)}%` }}
        />
      </div>
    </section>
  );
}
