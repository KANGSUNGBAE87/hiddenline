type MetricRowProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "failed" | "warning";
};

export function MetricRow({ label, value, tone = "default" }: MetricRowProps) {
  return (
    <div className={`metric-row metric-row--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
