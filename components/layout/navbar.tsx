"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Avatar } from "./avatar";
import "./navbar.css";
import { ModeToggle } from "./modetoggle";
import Logo from "./Logo";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/app/lib/useIsAdmin";
import UCAlert from "@/components/alerts/UCAlert";
import AddAccountAlert from "@/components/alerts/AddAccountAlert";
import AboutAlert from "@/components/alerts/AboutAlert";
import BulkDeleteAlert from "@/components/alerts/BulkDeleteAlert";

interface NavbarProps {
  adminName?: string;
  adminAvatar?: string;
}

export default function Navbar({ adminName = "Admin", adminAvatar = "/images/avatar.png" }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUCAlertOpen, setIsUCAlertOpen] = useState(false);
  const [isAddAccountAlertOpen, setIsAddAccountAlertOpen] = useState(false);
  const [isAboutAlertOpen, setIsAboutAlertOpen] = useState(false);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const router = useRouter();
  const { isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="w-full bg-black dark:bg-black shadow sticky top-0 z-50 border-b border-black">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2 h-16">
          <Link href="/" className="navbar-logo px-2 py-1 rounded hover:opacity-80 transition-opacity h-full flex items-center">
            <Logo />
          </Link>
          <ModeToggle />
        </div>
        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-4 relative text-white dark:text-white">
          <Link href="/" className="nav-link">Trang chủ</Link>
          {isAdmin && (
            <>
              <button
                onClick={() => setIsAddAccountAlertOpen(true)}
                className="nav-link-button"
              >
                Thêm tài khoản
              </button>
              <button
                onClick={() => setIsBulkDeleteAlertOpen(true)}
                className="nav-link-button text-red-400 hover:text-red-300"
              >
                Xóa tài khoản hàng loạt
              </button>
              <Link href="/admin/storage-calculator" className="nav-link">
                Storage Calculator
              </Link>
            </>
          )}
          <button
            onClick={() => setIsUCAlertOpen(true)}
            className="nav-link-button"
          >
            Nạp UC
          </button>
          <button
            onClick={() => setIsAboutAlertOpen(true)}
            className="nav-link-button"
          >
            Về shop
          </button>
        </nav>

        {/* Admin avatar + mobile toggle */}
        <div className="flex items-center gap-2">
          <Avatar
            name={adminName}
            src={adminAvatar}
            className="w-7 h-7"
            href="/login"
          />
          {isAdmin && (
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-white dark:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-all duration-200"
              title="Đăng xuất"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-1 rounded text-white dark:text-white hover:bg-gray-100 dark:hover:bg-black transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="px-4 py-2 flex flex-col gap-2 bg-gray-900/95 dark:bg-black/95 border-t border-gray-100 dark:border-gray-800 relative overflow-y-auto">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="mobile-link">Trang chủ</Link>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAddAccountAlertOpen(true);
                }}
                className="mobile-link-button w-full text-left"
              >
                Thêm tài khoản
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBulkDeleteAlertOpen(true);
                }}
                className="mobile-link-button w-full text-left text-red-400 hover:text-red-300"
              >
                Xóa tài khoản hàng loạt
              </button>
              <Link href="/admin/storage-calculator" onClick={() => setIsMenuOpen(false)} className="mobile-link">
                Storage Calculator
              </Link>
            </>
          )}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsUCAlertOpen(true);
            }}
            className="mobile-link-button w-full text-left"
          >
            Nạp UC
          </button>

          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsAboutAlertOpen(true);
            }}
            className="mobile-link-button w-full text-left"
          >
            Về shop
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="mobile-link-button w-full text-left flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          )}
        </nav>
      </div>

      {/* UC Alert */}
      <UCAlert isOpen={isUCAlertOpen} onClose={() => setIsUCAlertOpen(false)} />

      {/* Add Account Alert */}
      <AddAccountAlert
        isOpen={isAddAccountAlertOpen}
        onClose={() => setIsAddAccountAlertOpen(false)}
        onSuccess={() => {
          // Refresh page to show new accounts
          window.location.reload();
        }}
      />

      {/* About Alert */}
      <AboutAlert
        isOpen={isAboutAlertOpen}
        onClose={() => setIsAboutAlertOpen(false)}
      />

      {/* Bulk Delete Alert */}
      <BulkDeleteAlert
        isOpen={isBulkDeleteAlertOpen}
        onClose={() => setIsBulkDeleteAlertOpen(false)}
        onSuccess={() => {
          // Page will reload automatically after success
        }}
      />
    </header>
  );
}
