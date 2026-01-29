type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function Widget({ title, value, subtitle }: Props) {
  return (
    <div className="widget">
      <div className="widget-title">{title}</div>
      <div className="widget-value">{value}</div>
      {subtitle && <div className="widget-sub">{subtitle}</div>}
    </div>
  );
}
