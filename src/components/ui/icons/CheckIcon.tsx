interface Props {
  color?: string;
  size: number;
  className?: string;
}

export default function CheckIcon({ color = "currentColor", size, className }: Props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
