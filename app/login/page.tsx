"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/features/Loading";
import { Avatar } from "@/components/layout/avatar";
import "./page.css";
import "@/components/layout/avatar.css";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else if (data.user) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="login-container">
      <Navbar />

      <div className="login-content-wrapper">
        <div className="login-card">
          <div className="login-header">
            <Avatar
              name="Admin"
              src="/images/avatar.png"
              className="avatar-large"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-label">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              Đăng nhập
            </button>
          </form>

          <button
            onClick={() => router.push("/")}
            className="home-button"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
