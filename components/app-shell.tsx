"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Boxes, ChevronDown, FileText, LogOut, Menu, ReceiptText, Settings, UserCircle, Warehouse, WalletCards, X } from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { logoutLocal } from "@/services/auth-service";

export type AppNavKey = "dashboard" | "transactions" | "warehouses" | "inventory" | "documents" | "payments" | "analytics" | "messages";

export type AppShellHeader = {
  title: string;
  dateLabel: string;
  searchPlaceholder: string;
  unreadNotifications: number;
  avatarLabel: string;
  avatarSrc: string;
  profileName?: string;
  profileSubtitle?: string;
};

export type AppShellNotification = {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  unread: boolean;
  href: string;
  tone: "warning" | "success" | "info" | "danger";
};

const navItems: {
  key: AppNavKey;
  label: string;
  href: string;
  icon: AppNavKey;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    key: "transactions",
    label: "Transactions",
    href: "/transactions",
    icon: "transactions",
  },
  { key: "warehouses", label: "Warehouses", href: "/warehouses", icon: "warehouses" },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: "inventory" },
  { key: "documents", label: "Documents", href: "/documents", icon: "documents" },
  { key: "payments", label: "Payments", href: "/payments", icon: "payments" },
  {
    key: "analytics",
    label: "Data Analytics",
    href: "/data-analytics",
    icon: "analytics",
  },
  {
    key: "messages",
    label: "Messages",
    href: "/messages",
    icon: "messages",
  },
];

const hoverTransition = { type: "tween", duration: 0.1, ease: "easeOut" } as const;
const popoverTransition = { type: "tween", duration: 0.12, ease: "easeOut" } as const;
const notificationToneStyles = {
  danger: "bg-[#fff0f1] text-[#d64b55]",
  warning: "bg-[#fff5e3] text-[#986115]",
  success: "bg-[#e9f7ed] text-[#087d2f]",
  info: "bg-[#eaf2fd] text-[#2d5f9f]",
} satisfies Record<AppShellNotification["tone"], string>;
const defaultShellNotifications: AppShellNotification[] = [
  {
    id: "shell-missing-bl-0041",
    title: "TXN-0041: Missing document - Original B/L",
    description: "Document review is waiting for the original Bill of Lading.",
    timeAgo: "30 min ago",
    unread: true,
    href: "/transactions?tab=alerts&transaction=TXN-0041",
    tone: "danger",
  },
  {
    id: "shell-price-deviation-0044",
    title: "TXN-0044: Price deviation +8.2% above contracted",
    description: "Commodity price moved above the agreed threshold.",
    timeAgo: "1 hour ago",
    unread: false,
    href: "/transactions?transaction=TXN-0044",
    tone: "warning",
  },
  {
    id: "shell-payment-0028",
    title: "Payment received for TXN-0028 ($1.2M)",
    description: "Funds were marked as received for the wheat transaction.",
    timeAgo: "2 hours ago",
    unread: false,
    href: "/transactions?tab=closed&transaction=TXN-0028",
    tone: "success",
  },
];

export function AppShell({
  activeNav,
  children,
  header,
  mainClassName = "gap-[22px] px-4 py-[22px] sm:px-6 lg:px-5",
  notifications = defaultShellNotifications,
}: {
  activeNav: AppNavKey;
  children: ReactNode;
  header: AppShellHeader;
  mainClassName?: string;
  notifications?: AppShellNotification[];
}) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((notification) => notification.unread).length || header.unreadNotifications;
  const profileName = header.profileName || "System Admin";
  const profileSubtitle = header.profileSubtitle || "AgroTrust Backoffice";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  function handleLogout() {
    logoutLocal();
    router.replace("/");
  }

  return (
    <div className="agrotrust-admin-surface min-h-screen overflow-x-hidden bg-[#f1f1f1] text-[#2b2b2f] lg:pl-[170px]">
      <Sidebar activeNav={activeNav} />
      <MobileNavigation
        activeNav={activeNav}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onOpen={() => {
          setOpenMenu(null);
          setMobileNavOpen(true);
        }}
      />
      <div className="min-w-0">
        <header className="z-20 border-b border-[#eeeeee] bg-white lg:sticky lg:top-0">
          <div className="flex min-h-[62px] w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-0 lg:px-5">
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold leading-[23px] text-[#2b2b2f]">{header.title}</h1>
              <p className="text-[12px] font-medium leading-[16px] text-[#a7a7aa]">{header.dateLabel}</p>
            </div>
            <div className="relative flex min-w-0 items-center justify-end gap-4" ref={menuRef}>
              <label className="relative hidden sm:block">
                <span className="sr-only">Search transactions, commodities, or lots</span>
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bebec2]" />
                <input
                  aria-label="Search transactions, commodities, or lots"
                  className="h-[38px] w-[260px] rounded-[8px] border border-[#dddddf] bg-[#fafafa] py-0 pl-11 pr-4 text-[12px] font-medium leading-[20px] text-[#737378] outline-none placeholder:text-[#b8b8bc] md:w-[300px]"
                  placeholder={header.searchPlaceholder}
                  readOnly
                />
              </label>
              <motion.button
                aria-expanded={openMenu === "notifications"}
                aria-label={`Notifications, ${unreadCount} unread`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#66666b] transition hover:bg-[#f4f4f4] focus:outline-none focus:ring-2 focus:ring-[#15447C]/20"
                onClick={() => setOpenMenu((current) => (current === "notifications" ? null : "notifications"))}
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? <span className="absolute right-[7px] top-[6px] h-[6px] w-[6px] rounded-full bg-[#ef4f55]" /> : null}
              </motion.button>
              <motion.button
                aria-expanded={openMenu === "profile"}
                aria-label={profileName ? `${profileName} profile` : header.avatarLabel}
                className="flex h-9 items-center gap-1 rounded-full border border-transparent p-[2px] transition hover:border-[#dbe6f4] hover:bg-[#f7fbff] focus:outline-none focus:ring-2 focus:ring-[#15447C]/20"
                onClick={() => setOpenMenu((current) => (current === "profile" ? null : "profile"))}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#0fc092] bg-[#0fc092]">
                  <Image alt="" className="h-full w-full object-cover" height={32} src={header.avatarSrc} width={32} />
                </span>
                <ChevronDown className={`hidden h-4 w-4 text-[#77777d] transition sm:block ${openMenu === "profile" ? "rotate-180" : ""}`} />
              </motion.button>
              <HeaderPopovers
                avatarSrc={header.avatarSrc}
                notifications={notifications}
                onLogout={handleLogout}
                openMenu={openMenu}
                profileName={profileName}
                profileSubtitle={profileSubtitle}
              />
            </div>
            <label className="relative order-3 block w-full sm:hidden">
              <span className="sr-only">Search transactions, commodities, or lots</span>
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bebec2]" />
              <input
                aria-label="Search transactions, commodities, or lots"
                className="h-[38px] w-full rounded-[8px] border border-[#dddddf] bg-[#fafafa] py-0 pl-11 pr-4 text-[12px] font-medium leading-[20px] text-[#737378] outline-none placeholder:text-[#b8b8bc]"
                placeholder={header.searchPlaceholder}
                readOnly
              />
            </label>
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }} className={`grid w-full ${mainClassName}`}>{children}</motion.main>
      </div>
    </div>
  );
}

function HeaderPopovers({
  avatarSrc,
  notifications,
  onLogout,
  openMenu,
  profileName,
  profileSubtitle,
}: {
  avatarSrc: string;
  notifications: AppShellNotification[];
  onLogout: () => void;
  openMenu: "notifications" | "profile" | null;
  profileName: string;
  profileSubtitle: string;
}) {
  return (
    <AnimatePresence>
      {openMenu === "notifications" ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed left-4 right-4 top-[176px] z-50 overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white shadow-[0_18px_50px_rgba(0,28,66,0.16)] sm:absolute sm:left-auto sm:right-10 sm:top-[44px] sm:w-[340px]"
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={popoverTransition}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#eeeeef] px-4 py-3">
            <div>
              <h2 className="text-[14px] font-semibold leading-[20px] text-[#2f2f34]">Notifications</h2>
              <p className="text-[12px] font-medium leading-[18px] text-[#99999f]">Latest account updates</p>
            </div>
            <a className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold leading-[18px] text-[#2d5f9f] transition hover:text-[#164780]" href="/transactions?tab=alerts">
              View all
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="max-h-[330px] overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <motion.a
                  className="group grid gap-1 rounded-[6px] px-3 py-3 outline-none transition-colors duration-100 ease-out hover:bg-[#f7faff] focus:bg-[#f7faff] focus:ring-2 focus:ring-[#15447C]/15"
                  href={notification.href}
                  key={notification.id}
                  transition={hoverTransition}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-full ${notificationToneStyles[notification.tone]}`}>
                      <span className="flex h-full w-full items-center justify-center">
                        <Bell className="h-4 w-4" />
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-[12px] font-semibold leading-[17px] text-[#333338] group-hover:text-[#15447C]">{notification.title}</h3>
                        {notification.unread ? <span className="mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full bg-[#ef4f55]" /> : null}
                      </div>
                      <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#87878d]">{notification.description}</p>
                      <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#aaaab0]">{notification.timeAgo}</p>
                    </div>
                  </div>
                </motion.a>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-[13px] font-medium leading-[20px] text-[#8d8d93]">No notifications</div>
            )}
          </div>
          <div className="border-t border-[#eeeeef] p-2">
            <a className="flex h-10 items-center justify-center gap-2 rounded-[6px] text-[12px] font-semibold leading-[18px] text-[#2d5f9f] transition hover:bg-[#f7faff] hover:text-[#164780]" href="/transactions?tab=alerts">
              View all notifications
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>
      ) : null}

      {openMenu === "profile" ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed right-4 top-[176px] z-50 w-[230px] overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white shadow-[0_18px_50px_rgba(0,28,66,0.16)] sm:absolute sm:right-0 sm:top-[44px]"
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={popoverTransition}
        >
          <div className="flex items-center gap-3 border-b border-[#eeeeef] px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#0fc092] bg-[#0fc092]">
              <Image alt="" className="h-full w-full object-cover" height={40} src={avatarSrc} width={40} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-[18px] text-[#303034]">{profileName}</p>
              <p className="truncate text-[11px] font-medium leading-[16px] text-[#8d8d93]">{profileSubtitle}</p>
            </div>
          </div>
          <div className="grid p-2">
            <button className="flex h-10 items-center gap-3 rounded-[6px] px-3 text-left text-[13px] font-medium leading-[18px] text-[#4a4a50] transition hover:bg-[#f7faff] hover:text-[#15447C]" type="button">
              <UserCircle className="h-4 w-4" />
              Profile
            </button>
            <button className="flex h-10 items-center gap-3 rounded-[6px] px-3 text-left text-[13px] font-medium leading-[18px] text-[#4a4a50] transition hover:bg-[#f7faff] hover:text-[#15447C]" type="button">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              className="flex h-10 items-center gap-3 rounded-[6px] px-3 text-left text-[13px] font-medium leading-[18px] text-[#b23a42] transition hover:bg-[#fff0f1]"
              onClick={onLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Sidebar({ activeNav }: { activeNav: AppNavKey }) {
  return (
    <aside
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-30 hidden w-[170px] flex-col px-3 py-6 lg:flex"
      style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
    >
      <a aria-label="AgroTrust dashboard" className="mb-6 block px-2" href="/dashboard">
        <Image alt="AgroTrust" className="h-7 w-[139px] object-contain" height={28} priority src="/agrotrust-logo.svg" width={139} />
      </a>
      <nav className="grid gap-2">
        {navItems.map((item) => (
          <NavLink active={item.key === activeNav} href={item.href} icon={item.icon} key={item.key} label={item.label} />
        ))}
      </nav>
      <LogoutButton className="mt-auto px-2 text-left text-[12px] font-medium leading-[18px] text-[#b9c9dc] underline underline-offset-2 transition hover:text-white" />
    </aside>
  );
}

function MobileNavigation({
  activeNav,
  onClose,
  onOpen,
  open,
}: {
  activeNav: AppNavKey;
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
}) {
  return (
    <div className="sticky top-0 z-40 lg:hidden">
      <div
        className="flex h-[58px] items-center justify-between gap-4 border-b border-white/10 px-4"
        style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
      >
        <a aria-label="AgroTrust dashboard" href="/dashboard">
          <Image alt="AgroTrust" className="h-7 w-[139px] object-contain" height={28} priority src="/agrotrust-logo.svg" width={139} />
        </a>
        <motion.button
          aria-controls="mobile-navigation-drawer"
          aria-expanded={open}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-white/15 bg-white/8 text-white outline-none transition hover:bg-white/14 focus:ring-2 focus:ring-white/30"
          onClick={onOpen}
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          <Menu className="h-5 w-5" />
        </motion.button>
      </div>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              aria-label="Close navigation menu"
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-40 bg-[#001C42]/45 backdrop-blur-[1px]"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={onClose}
              transition={{ duration: 0.16, ease: "easeOut" }}
              type="button"
            />
            <motion.aside
              animate={{ x: 0 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-[286px] max-w-[86vw] flex-col px-4 py-5 shadow-[18px_0_50px_rgba(0,28,66,0.24)]"
              exit={{ x: "-100%" }}
              id="mobile-navigation-drawer"
              initial={{ x: "-100%" }}
              style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between gap-3">
                <a aria-label="AgroTrust dashboard" href="/dashboard" onClick={onClose}>
                  <Image alt="AgroTrust" className="h-7 w-[139px] object-contain" height={28} priority src="/agrotrust-logo.svg" width={139} />
                </a>
                <button
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-[7px] text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  onClick={onClose}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav aria-label="Primary navigation" className="mt-7 grid gap-2">
                {navItems.map((item) => (
                  <NavLink active={item.key === activeNav} href={item.href} icon={item.icon} key={item.key} label={item.label} mobile onClick={onClose} />
                ))}
              </nav>
              <LogoutButton className="mt-auto px-3 py-3 text-left text-[12px] font-medium leading-[18px] text-[#b9c9dc] underline underline-offset-2 transition hover:text-white" />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavLink({
  active,
  href,
  icon,
  label,
  mobile = false,
  onClick,
}: {
  active: boolean;
  href: string;
  icon: AppNavKey;
  label: string;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      aria-current={active ? "page" : undefined}
      className={`flex ${mobile ? "h-9 shrink-0 gap-2" : "h-[34px] gap-3"} items-center rounded-[5px] px-3 text-[12px] font-medium leading-[18px] tracking-[-0.15px] transition ${
        active ? "bg-[#15447C] text-white" : "text-[#b9c9dc] hover:bg-white/10 hover:text-white"
      }`}
      href={href}
      onClick={onClick}
    >
      <SidebarIcon icon={icon} />
      <span>{label}</span>
    </a>
  );
}

function SidebarIcon({ icon }: { icon: AppNavKey }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3Zm10 0A1.5 1.5 0 0 1 15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3Zm-10 10A1.5 1.5 0 0 1 5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3Zm10 0a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "transactions": return <ReceiptText aria-hidden className="h-4 w-4 shrink-0" />;
    case "warehouses": return <Warehouse aria-hidden className="h-4 w-4 shrink-0" />;
    case "inventory": return <Boxes aria-hidden className="h-4 w-4 shrink-0" />;
    case "documents": return <FileText aria-hidden className="h-4 w-4 shrink-0" />;
    case "payments": return <WalletCards aria-hidden className="h-4 w-4 shrink-0" />;
    case "analytics":
      return (
        <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <path d="M5 19V5m0 14h14M9 16v-5m4 5V8m4 8v-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "messages":
      return (
        <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4.5A2.5 2.5 0 0 1 5 12.5v-6Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m20 20-4.6-4.6m2.5-5.4a7.9 7.9 0 1 1-15.8 0 7.9 7.9 0 0 1 15.8 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
