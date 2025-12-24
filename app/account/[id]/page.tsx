"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/features/Loading';
import Navbar from '@/components/layout/navbar';
import { useIsAdmin } from '@/app/lib/useIsAdmin';
import { AccountCarousel } from '@/components/features/AccountCarousel';
import InstallmentAlert from '@/components/alerts/InstallmentAlert';
import ContactAlert from '@/components/alerts/ContactAlert';
import './page.css';

export default function AccountDetailPage() {
  const params = useParams();
  const [account, setAccount] = useState<any>(null);
  const [accountImages, setAccountImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarAccounts, setSimilarAccounts] = useState<any[]>([]);
  const [downPayment, setDownPayment] = useState<string>('');
  const [installmentMonths, setInstallmentMonths] = useState<number>(1);
  const [isInstallmentAlertOpen, setIsInstallmentAlertOpen] = useState(false);
  const [isContactAlertOpen, setIsContactAlertOpen] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (params.id) {
      fetchAccount(params.id as string);
    }
  }, [params.id]);

  async function fetchAccount(id: string) {
    try {
      setLoading(true);
      setError(null);

      // Fetch account - chỉ select fields cần thiết để giảm bandwidth
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id, title, price, image_url, description, main_acc, created_at')
        .eq('id', id)
        .single();

      if (accountError) {
        setError('Không tìm thấy tài khoản');
        console.error(accountError);
        return;
      }

      // Fetch account images
      const { data: imagesData, error: imagesError } = await supabase
        .from('account_images')
        .select('image_url')
        .eq('acc_id', id)
        .order('created_at', { ascending: true });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      }

      // Prepare images array
      const images: string[] = [];

      // If account has image_url, add it as first image
      if (accountData.image_url) {
        images.push(accountData.image_url);
      }

      // Add images from account_images table
      if (imagesData && imagesData.length > 0) {
        imagesData.forEach((img: any) => {
          if (img.image_url && !images.includes(img.image_url)) {
            images.push(img.image_url);
          }
        });
      }

      setAccount(accountData);
      setAccountImages(images);
      setSelectedImageIndex(0);

      // Fetch similar accounts (exclude current account)
      await fetchSimilarAccounts(id, accountData);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSimilarAccounts(currentId: string, currentAccount: any) {
    try {
      // Fetch 12 similar accounts (excluding current account) for 4 pages carousel
      // You can adjust the query to find similar accounts based on price range or other criteria
      const { data: similarData, error: similarError } = await supabase
        .from('accounts')
        .select('*')
        .neq('id', currentId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (similarError) {
        console.error('Error fetching similar accounts:', similarError);
        return;
      }

      setSimilarAccounts(similarData || []);
    } catch (err) {
      console.error('Error fetching similar accounts:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <Loading />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white dark:bg-black rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {error || 'Không tìm thấy tài khoản'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tài khoản này có thể đã bị xóa hoặc không tồn tại.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format price with thousand separators
  const formatPrice = (price: string | number): string => {
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

  // Calculate days since posted
  const getDaysSincePosted = () => {
    if (!account.created_at) return "N/A";
    const now = new Date();
    const created = new Date(account.created_at);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày";
    return `${diffDays} ngày`;
  };

  return (
    <div className="account-detail-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </Link>

        {/* Main Content */}
        <div className="account-main-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="account-image-container">
              {accountImages.length > 0 ? (
                <div className="account-image-gallery">
                  {/* Main Image */}
                  <div className="account-main-image-wrapper">
                    <Image
                      src={accountImages[selectedImageIndex]}
                      alt={account.title || 'Account image'}
                      width={800}
                      height={600}
                      className="account-image"
                      onClick={() => setIsImageZoomOpen(true)}
                      style={{ cursor: 'pointer' }}
                      quality={85}
                      unoptimized={accountImages[selectedImageIndex]?.includes('supabase.co')}
                      loading="eager"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Zoom Button */}
                    <button
                      className="account-image-zoom-btn"
                      onClick={() => setIsImageZoomOpen(true)}
                      aria-label="Zoom image"
                      title="Phóng to ảnh"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </button>
                    {/* Navigation arrows for multiple images */}
                    {accountImages.length > 1 && (
                      <>
                        <button
                          className="account-image-nav account-image-nav-prev"
                          onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? accountImages.length - 1 : prev - 1))}
                          aria-label="Previous image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          className="account-image-nav account-image-nav-next"
                          onClick={() => setSelectedImageIndex((prev) => (prev === accountImages.length - 1 ? 0 : prev + 1))}
                          aria-label="Next image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails - only show if more than 1 image */}
                  {accountImages.length > 1 && (
                    <div className="account-image-thumbnails">
                      {accountImages.map((img, index) => (
                        <button
                          key={index}
                          className={`account-thumbnail ${selectedImageIndex === index ? 'account-thumbnail-active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                          aria-label={`View image ${index + 1}`}
                        >
                          <Image
                            src={img}
                            alt={`Thumbnail ${index + 1}`}
                            width={80}
                            height={80}
                            quality={60}
                            unoptimized={img?.includes('supabase.co')}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="account-image-placeholder">
                  <svg className="w-24 h-24 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="account-details-section">
              <div className="account-details-content">
                <div className="account-title-row">
                  <h1 className="account-title">
                    {account.title || 'Không có tiêu đề'}
                  </h1>
                  <div className="account-price-badge-inline">
                    {formatPrice(account.price)} VND
                  </div>
                </div>

                {account.id && (
                  <div className="account-id">
                    <svg className="account-id-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="account-id-label">ID:</span>
                    <span className="account-id-value">{account.id}</span>
                  </div>
                )}

                {isAdmin && account.main_acc && (
                  <div className="account-main-acc">
                    <svg className="account-main-acc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="account-main-acc-label">Chủ tài khoản:</span>
                    <span className="account-main-acc-value">{account.main_acc}</span>
                  </div>
                )}

                {/* Stats Section */}
                <div className="account-stats">
                  <div className="account-stat">
                    <svg className="account-stat-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <div className="account-stat-content">
                      <span className="account-stat-value">{getDaysSincePosted()}</span>
                      <span className="account-stat-label">Đã đăng</span>
                    </div>
                  </div>
                </div>

                {account.description && (
                  <div className="account-description-section">
                    <h2 className="account-section-title">Thông tin tài khoản</h2>
                    <p className="account-description-text">
                      {account.description}
                    </p>
                  </div>
                )}

                {isAdmin && account.main_acc && (
                  <div className="account-main-acc-section">
                    <h2 className="account-section-title">Thông tin chủ sở hữu</h2>
                    <div className="account-main-acc-info">
                      <svg className="account-main-acc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="account-main-acc-label">Chủ sở hữu:</span>
                      <span className="account-main-acc-value">{account.main_acc}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="account-actions">
                <button
                  className="account-button-primary"
                  onClick={() => setIsContactAlertOpen(true)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Liên hệ mua hàng
                </button>
                <button className="account-button-secondary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Thêm vào yêu thích
                </button>
                <button
                  type="button"
                  onClick={() => setIsInstallmentAlertOpen(true)}
                  className="account-button-secondary"
                  title="Tính lãi góp"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-5m-3 5h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Tính lãi góp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Accounts Section */}
        <div className="related-accounts-section">
          <h2 className="related-accounts-title">Tài khoản tương tự</h2>
          <AccountCarousel accounts={similarAccounts} />
        </div>
      </div>

      {/* Installment Alert */}
      <InstallmentAlert
        isOpen={isInstallmentAlertOpen && !!account}
        onClose={() => {
          console.log('Closing alert');
          setIsInstallmentAlertOpen(false);
        }}
        accountPrice={account?.price || 0}
        downPayment={downPayment}
        setDownPayment={setDownPayment}
        installmentMonths={installmentMonths}
        setInstallmentMonths={setInstallmentMonths}
      />

      {/* Contact Alert */}
      <ContactAlert
        isOpen={isContactAlertOpen}
        onClose={() => setIsContactAlertOpen(false)}
      />

      {/* Image Zoom Modal */}
      {isImageZoomOpen && accountImages.length > 0 && (
        <div
          className="account-image-zoom-modal"
          onClick={() => setIsImageZoomOpen(false)}
        >
          <div
            className="account-image-zoom-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="account-image-zoom-close"
              onClick={() => setIsImageZoomOpen(false)}
              aria-label="Close zoom"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={accountImages[selectedImageIndex]}
              alt={account.title || 'Account image zoomed'}
              className="account-image-zoomed"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
            {accountImages.length > 1 && (
              <>
                <button
                  className="account-image-zoom-nav account-image-zoom-nav-prev"
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? accountImages.length - 1 : prev - 1))}
                  aria-label="Previous image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="account-image-zoom-nav account-image-zoom-nav-next"
                  onClick={() => setSelectedImageIndex((prev) => (prev === accountImages.length - 1 ? 0 : prev + 1))}
                  aria-label="Next image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="account-image-zoom-indicator">
                  {selectedImageIndex + 1} / {accountImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
