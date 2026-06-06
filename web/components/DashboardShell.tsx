'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  FileText,
  Home,
  LibraryBig,
  LayoutGrid,
  Menu,
  Settings,
  Sparkles,
  Users,
  Plus
} from 'lucide-react';
import { demoProfile, mobileNavItems } from '@/shared/profile';
import React from 'react';

type DashboardShellProps = {
  breadcrumb: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  showFloatingAdd?: boolean;
};

const desktopNav = [
  { href: '/assignments', label: 'Home', icon: Home },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: FileText, badge: '32' },
  { href: '/assignments/new', label: 'AI Teacher\'s Toolkit', icon: Sparkles, primary: true },
  { href: '/library', label: 'My Library', icon: LibraryBig }
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export function DashboardShell({
  breadcrumb,
  backHref,
  backLabel = 'Assignment',
  children,
  showFloatingAdd = true
}: DashboardShellProps) {
  const pathname = usePathname();
  const mobileItems =
    pathname.startsWith('/assignments/new')
      ? [
          { label: 'Home', href: '/assignments' },
          { label: 'My Groups', href: '/assignments/new' },
          { label: 'Library', href: '/library' },
          { label: 'AI Toolkit', href: '/assignments/new' }
        ]
      : mobileNavItems;

  return (
    <div className="app-canvas">
      <div className="app-shell">
        <aside className="desktop-sidebar">
          <div className="brand-card">
            <div className="brand-lockup">
              <div className="brand-mark">
                <span>V</span>
              </div>
              <span className="brand-name">{demoProfile.appName}</span>
            </div>
          </div>

          <Link href="/assignments/new" className="sidebar-cta">
            <Sparkles size={15} />
            <span>{demoProfile.toolkitLabel}</span>
          </Link>

          <nav className="sidebar-nav">
            {desktopNav.map((item) => {
              const Icon = item.icon;
              let active = false;
              if (item.primary) {
                active = true;
              } else if (item.label === 'Home') {
                active = pathname.startsWith('/assignments');
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`sidebar-link${active ? ' is-active' : ''}${item.primary ? ' is-primary' : ''}`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {item.badge ? <em className="sidebar-badge">{item.badge}</em> : null}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-spacer" />

          <Link href="/settings" className="sidebar-settings">
            <Settings size={14} />
            <span>Settings</span>
          </Link>

          <div className="school-card">
            <div className="school-emblem">DP</div>
            <div>
              <strong>{demoProfile.schoolShortName}</strong>
              <span>{demoProfile.schoolSubtitle}</span>
            </div>
          </div>
        </aside>

        <section className="content-shell">
          <header className="desktop-topbar">
            <div className="topbar-left">
              {backHref ? (
                <Link href={backHref} className="back-pill">
                  <ArrowLeft size={17} />
                </Link>
              ) : (
                <span className="back-pill ghost">
                  <LayoutGrid size={15} />
                </span>
              )}
              <span className="crumb-label">{breadcrumb}</span>
            </div>

            <div className="topbar-right">
              <button className="icon-chip" type="button" aria-label="Notifications">
                <Bell size={15} />
                <span className="notification-dot" />
              </button>

              <button className="user-chip" type="button">
                <span className="avatar-chip" />
                <span>{demoProfile.userName}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </header>

          <header className="mobile-topbar">
            <div className="mobile-brandbar">
              <div className="brand-lockup">
                <div className="brand-mark">
                  <span>V</span>
                </div>
                <span className="brand-name">{demoProfile.appName}</span>
              </div>

              <div className="mobile-actions">
                <button className="icon-chip" type="button" aria-label="Notifications">
                  <Bell size={15} />
                  <span className="notification-dot" />
                </button>
                <span className="avatar-chip" />
                <button className="icon-chip" type="button" aria-label="Menu">
                  <Menu size={15} />
                </button>
              </div>
            </div>

            <div className="mobile-crumbbar">
              {backHref ? (
                <Link href={backHref} className="mobile-back">
                  <ArrowLeft size={16} />
                </Link>
              ) : (
                <span className="mobile-back ghost">
                  <LayoutGrid size={15} />
                </span>
              )}
              <span>{breadcrumb}</span>
            </div>
          </header>

          <main className="page-surface">{children}</main>
        </section>
      </div>

      <nav className="mobile-bottom-nav">
        {mobileItems.map((item) => {
          const active =
            pathname.startsWith('/assignments/new')
              ? item.label === 'My Groups'
              : item.label === 'Assignments'
              ? pathname.startsWith('/assignments')
              : item.label === 'AI Toolkit'
                ? pathname.startsWith('/assignments/new')
                : false;
          return (
            <Link key={item.label} href={item.href} className={`mobile-bottom-item${active ? ' is-active' : ''}`}>
              <span className="mobile-bottom-icon">
                {item.href === '/assignments/new' ? (
                  <Sparkles size={15} />
                ) : item.href === '/library' ? (
                  <LibraryBig size={15} />
                ) : item.href === '/assignments' ? (
                  item.label === 'Home' ? <Home size={15} /> : <FileText size={15} />
                ) : (
                  <Home size={15} />
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showFloatingAdd ? (
        <Link href="/assignments/new" className="floating-add">
          <Plus size={18} />
        </Link>
      ) : null}
    </div>
  );
}
