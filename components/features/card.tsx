"use client";

import React, { useState } from "react";
import Image from "next/image";
import "./card.css";

interface CardProps {
  imageUrl?: string;
  title: string;
  description?: string;
  price: number | string;
  onClick?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
  href?: string;
  id?: string | number;
  createdAt?: string | Date;
  mainAcc?: string;
  isAdmin?: boolean;
}

export default function Card({ imageUrl, title, description, price, onClick, onSave, onDelete, onUpdate, href, id, createdAt, mainAcc, isAdmin }: CardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.();
  };

  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else {
      onClick?.();
    }
  };

  // Format price with thousand separators
  const formatPrice = (price: number | string): string => {
    if (typeof price === 'string') {
      // Try to parse string price (may contain K, k, commas, etc.)
      const cleaned = price.trim().replace(/[kK,.\s]/g, '');
      const numPrice = parseFloat(cleaned);
      if (!isNaN(numPrice)) {
        return new Intl.NumberFormat('vi-VN').format(numPrice);
      }
      return price;
    }
    // If number, format with thousand separators
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const priceDisplay = formatPrice(price);

  // Calculate days since posted
  const getDaysSincePosted = () => {
    if (!createdAt) return "N/A";
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày";
    return `${diffDays} ngày`;
  };

  return (
    <div className="card" onClick={handleClick}>
      <div className="card-image">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={400}
            height={300}
            className="card-image-img"
            loading="lazy"
            quality={75}
            unoptimized={imageUrl?.includes('supabase.co')}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="card-image-placeholder">
            <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Bookmark Icon on Image (Card A style) */}
        <button
          className={`card-bookmark-image ${isSaved ? 'saved' : ''}`}
          onClick={handleSave}
          aria-label="Save"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title">{title}</h3>
          <div className="card-price">{priceDisplay} VND</div>
        </div>

        {id && (
          <div className="card-id">
            <svg className="card-id-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="card-id-label">ID:</span>
            <span className="card-id-value">{id}</span>
          </div>
        )}

        {isAdmin && mainAcc && (
          <div className="card-main-acc">
            <svg className="card-main-acc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="card-main-acc-label">Chủ TK:</span>
            <span className="card-main-acc-value">{mainAcc}</span>
          </div>
        )}

        {/* Stats Section */}
        <div className="card-stats">
          <div className="card-stat">
            <svg className="card-stat-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div className="card-stat-content">
              <span className="card-stat-value">{getDaysSincePosted()}</span>
              <span className="card-stat-label">Đã đăng</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Card B style) */}
        <div className="card-actions">
          <button className="card-button-primary" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            <span>Xem chi tiết</span>
          </button>
          {isAdmin && onUpdate && (
            <button
              className="card-button-update"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate();
              }}
              aria-label="Update account"
              title="Cập nhật tài khoản"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              className="card-button-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete account"
              title="Xóa tài khoản"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          <button
            className={`card-button-save ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
            aria-label="Save for later"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
