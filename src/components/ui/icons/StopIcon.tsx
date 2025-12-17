interface IconProps {
  size?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export default function StopIcon({ size = 24, fill = "currentColor", stroke = "currentColor", className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
    </svg>
  );
}
