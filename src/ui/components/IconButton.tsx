import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
};

export function IconButton({ icon, label, ...props }: IconButtonProps) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} {...props}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
