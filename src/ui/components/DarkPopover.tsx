import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import type { I18n } from "../../i18n";

type PopoverOption = { id: string; label: string };

type DarkPopoverProps = {
  label: string;
  options: PopoverOption[];
  selectedId: string;
  onChange: (id: string) => void;
  i18n: I18n;
};

export function DarkPopover({ label, options, selectedId, onChange, i18n }: DarkPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.id === selectedId)?.label ?? selectedId;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  function selectOption(optionId: string) {
    onChange(optionId);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="dark-popover" role="group" aria-label={label}>
      <button
        ref={triggerRef}
        type="button"
        className="dark-popover__trigger"
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selectedLabel}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dark-popover__value">
          <span className="dark-popover__label-text">{label}</span>
          <span className="dark-popover__selected">{selectedLabel}</span>
        </span>
        <span className="dark-popover__chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="dark-popover__menu"
          role="listbox"
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`dark-popover__option${option.id === selectedId ? " dark-popover__option--selected" : ""}`}
              role="option"
              aria-selected={option.id === selectedId}
              onClick={() => selectOption(option.id)}
            >
              {option.label}
              {option.id === selectedId && <span className="dark-popover__check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const difficultyOptions: { id: string; labelKo: string; labelEn: string }[] = [
  { id: "easy", labelKo: "쉬움", labelEn: "Easy" },
  { id: "normal", labelKo: "보통", labelEn: "Normal" },
  { id: "hard", labelKo: "어려움", labelEn: "Hard" },
];

export const sightOptions: { id: string; labelKo: string; labelEn: string }[] = [
  { id: "easy", labelKo: "넓게", labelEn: "Easy" },
  { id: "normal", labelKo: "보통", labelEn: "Normal" },
  { id: "hard", labelKo: "좁게", labelEn: "Hard" },
];

export function getLabelForLocale(opts: { id: string; labelKo: string; labelEn: string }[], id: string, locale: string): string {
  const opt = opts.find((o) => o.id === id);
  if (!opt) return id;
  return locale === "ko" ? opt.labelKo : opt.labelEn;
}
