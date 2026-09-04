"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export const managementHeader = (title: string) => ({
  title,
  dateLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
  searchPlaceholder: "Search transaction number",
  unreadNotifications: 0,
  avatarLabel: "User profile",
  avatarSrc: "/user-avatar.png",
});

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[24px] font-bold text-[#26262b]">{title}</h1>
        <p className="mt-1 text-[13px] leading-5 text-[#85858b]">
          {description}
        </p>
      </div>
      {action ? <div className="z-10 sm:sticky sm:top-[78px]">{action}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 min-w-[112px] items-center justify-center rounded-[7px] bg-[#15447c] px-4 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0d3768] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 min-w-[112px] items-center justify-center rounded-[7px] border px-4 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "border-[#efc5c9] text-[#a73640] hover:bg-[#fff1f2]" : "border-[#dfe3e8] text-[#526170] hover:bg-[#f5f8fb]"}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      removeEventListener("keydown", close);
    };
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[120] grid place-items-center bg-[#061426]/55 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[92dvh] w-full max-w-[680px] overflow-auto rounded-[12px] bg-white shadow-[0_30px_90px_rgba(0,20,50,.3)]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ebebee] bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-[17px] font-bold text-[#29292e]">{title}</h2>
            {description ? (
              <p className="mt-1 text-[11px] leading-5 text-[#85858b]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close dialog"
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-md transition hover:bg-[#f2f3f5]"
          >
            <X size={17} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </motion.section>
    </motion.div>
  );
}

export function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  step,
  accept,
  multiple,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
  accept?: string;
  multiple?: boolean;
  placeholder?: string;
}) {
  const hint =
    placeholder ||
    (type === "number"
      ? `Enter ${label.toLowerCase()}`
      : type === "file"
        ? undefined
        : `Enter ${label.toLowerCase()}`);
  return (
    <label className="grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#585961]">
      <span>
        {label}
        {required ? <span className="ml-1 text-[#b63d48]">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        accept={accept}
        multiple={multiple}
        placeholder={hint}
        className="peer h-10 min-w-0 appearance-none rounded-[7px] border border-[#dedef2] bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-[#aaabb1] focus:border-[#3971ad] focus:ring-3 focus:ring-[#15447c]/10 user-invalid:border-[#ce5963] file:mr-2 file:border-0 file:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="hidden text-[10px] font-medium text-[#aa3640] peer-user-invalid:block">
        Please complete this field.
      </span>
    </label>
  );
}

export function DateField({
  name,
  label,
  required,
  defaultValue = "",
  placeholder = "Select a date",
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  const initial = defaultValue
    ? new Date(`${defaultValue}T12:00:00`)
    : new Date();
  const [value, setValue] = useState(defaultValue);
  const [month, setMonth] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const first = (month.getDay() + 6) % 7;
  const total = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - first + 1;
    return day > 0 && day <= total ? day : null;
  });
  const choose = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    setValue(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
    setTouched(true);
    setOpen(false);
  };
  const display = value
    ? new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${value}T12:00:00`))
    : placeholder;
  return (
    <div
      ref={root}
      className="relative grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#585961]"
    >
      <span>
        {label}
        {required ? <span className="ml-1 text-[#b63d48]">*</span> : null}
      </span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => {
          setOpen((x) => !x);
          setTouched(true);
        }}
        className={`flex h-10 items-center justify-between rounded-[7px] border bg-white px-3 text-[12px] font-normal outline-none transition focus:ring-3 focus:ring-[#15447c]/10 ${required && touched && !value ? "border-[#ce5963]" : "border-[#dedef2] focus:border-[#3971ad]"}`}
      >
        <span className={value ? "text-[#35363c]" : "text-[#aaabb1]"}>
          {display}
        </span>
        <CalendarDays size={16} className="text-[#66809e]" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute bottom-[48px] left-0 z-50 w-[292px] max-w-[calc(100vw-40px)] rounded-[10px] border border-[#dfe3e8] bg-white p-3 shadow-[0_18px_45px_rgba(12,35,65,.18)]"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="grid size-8 place-items-center rounded-md hover:bg-[#eef4fa]"
              >
                <ChevronLeft size={16} />
              </button>
              <strong className="text-[12px] text-[#30333a]">
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  year: "numeric",
                }).format(month)}
              </strong>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="grid size-8 place-items-center rounded-md hover:bg-[#eef4fa]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[9px] uppercase text-[#92959d]">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((x) => (
                <span key={x} className="py-1">
                  {x}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) =>
                day ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => choose(day)}
                    className={`grid aspect-square place-items-center rounded-md text-[11px] transition hover:bg-[#e9f1f9] ${value === `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` ? "bg-[#15447c] text-white hover:bg-[#15447c]" : "text-[#484b52]"}`}
                  >
                    {day}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {required && touched && !value ? (
        <span className="text-[10px] font-medium text-[#aa3640]">
          Please select a date.
        </span>
      ) : null}
    </div>
  );
}

type Option = { value: string; label: string };
export function SelectField({
  name,
  label,
  options,
  required,
  defaultValue = "",
  value,
  onChange,
  placeholder = "Select an option",
}: {
  name?: string;
  label: string;
  options: Option[];
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const [internal, setInternal] = useState(defaultValue),
    [open, setOpen] = useState(false),
    [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = value ?? internal;
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const choose = (next: string) => {
    setInternal(next);
    onChange?.(next);
    setTouched(true);
    setOpen(false);
  };
  return (
    <div
      ref={root}
      className="relative grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#585961]"
    >
      <label id={`${id}-label`}>
        {label}
        {required ? <span className="ml-1 text-[#b63d48]">*</span> : null}
      </label>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        aria-labelledby={`${id}-label`}
        aria-expanded={open}
        type="button"
        onClick={() => {
          setOpen((x) => !x);
          setTouched(true);
        }}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-[7px] border bg-white px-3 text-left text-[12px] font-normal outline-none transition focus:ring-3 focus:ring-[#15447c]/10 ${required && touched && !current ? "border-[#ce5963]" : "border-[#dedef2] focus:border-[#3971ad]"}`}
      >
        <span
          className={
            current ? "truncate text-[#35363c]" : "truncate text-[#97989e]"
          }
        >
          {options.find((x) => x.value === current)?.label || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[64px] z-50 max-h-56 overflow-auto rounded-[8px] border border-[#dfe3e8] bg-white p-1 shadow-[0_14px_35px_rgba(12,35,65,.16)]"
          >
            {options.length ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => choose(option.value)}
                  className="flex w-full items-center justify-between gap-3 rounded-[5px] px-3 py-2.5 text-left text-[12px] font-medium text-[#4b4d54] transition hover:bg-[#f0f5fb] hover:text-[#15447c]"
                >
                  <span className="truncate">{option.label}</span>
                  {current === option.value ? <Check size={14} /> : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-[11px] text-[#888a91]">
                No options available
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {required && touched && !current ? (
        <span className="text-[10px] font-medium text-[#aa3640]">
          Please select an option.
        </span>
      ) : null}
    </div>
  );
}

export function EmptyTable({
  loading,
  error,
  label,
  onRetry,
  prompt,
}: {
  loading: boolean;
  error?: string;
  label: string;
  onRetry?: () => void;
  prompt?: string;
}) {
  const Icon = loading ? LoaderCircle : error ? AlertTriangle : Inbox;
  const title = loading
    ? "Loading information"
    : error
      ? "We couldn’t load this information"
      : prompt || `No ${label} yet`;
  const detail = loading
    ? "This should only take a moment."
    : error
      ? error
      : `New ${label} will appear here when available.`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid min-h-[220px] place-items-center rounded-[10px] border border-[#e6e6e9] bg-white px-6 py-12 text-center"
    >
      <div className="max-w-[390px]">
        <span
          className={`mx-auto grid size-12 place-items-center rounded-full ${error ? "bg-[#fff0f1] text-[#b43e48]" : "bg-[#eef4fa] text-[#315f91]"}`}
        >
          <Icon size={21} className={loading ? "animate-spin" : ""} />
        </span>
        <h3 className="mt-4 text-[15px] font-semibold text-[#404147]">
          {title}
        </h3>
        <p className="mt-1.5 text-[12px] leading-5 text-[#85868d]">{detail}</p>
        {error ? (
          <button
            type="button"
            onClick={onRetry || (() => window.location.reload())}
            className="mx-auto mt-4 inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#d8e1eb] px-3 text-[11px] font-semibold text-[#15447c] transition hover:bg-[#f3f7fb]"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

export function Notice({
  message,
  error,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 rounded-[7px] border px-3 py-2.5 text-[12px] leading-5 ${error ? "border-[#efc2c7] bg-[#fff1f2] text-[#9f313b]" : "border-[#adddc0] bg-[#effaf3] text-[#176c3b]"}`}
    >
      {error ? (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      ) : (
        <Check size={15} className="mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}
export function formatValue(value: unknown) {
  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}
