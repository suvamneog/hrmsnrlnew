/* Numbers are shown as they are: no count-up, so a figure never reads wrong mid-animation. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  return <span className="tabular-nums">{format(value)}</span>;
}
