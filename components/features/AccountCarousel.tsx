"use client";
import { Carousel } from "@ark-ui/react/carousel"
import { useEffect, useState } from "react"
import Card from "./card"
import { useIsAdmin } from "@/app/lib/useIsAdmin"

interface Account {
  id: string | number;
  title: string;
  price: number | string;
  description?: string;
  image_url?: string;
  created_at?: string | Date;
  main_acc?: string;
}

interface AccountCarouselProps {
  accounts: Account[];
}

export const AccountCarousel = ({ accounts }: AccountCarouselProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { isAdmin } = useIsAdmin();
  
  // Số lượng card hiển thị mỗi slide
  const itemsPerPage = 3;
  // Giới hạn tối đa 12 accounts (4 trang x 3 accounts)
  const limitedAccounts = accounts.slice(0, 12);
  const totalPages = Math.ceil(limitedAccounts.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 1) {
      const interval = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
      }, 5000); // Tự động chuyển slide sau 5 giây

      return () => clearInterval(interval);
    }
  }, [totalPages]);

  if (limitedAccounts.length === 0) {
    return (
      <div className="related-accounts-placeholder">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="related-accounts-text">Không có tài khoản tương tự</p>
      </div>
    );
  }

  // Chia accounts thành các nhóm cho mỗi slide
  const getAccountsForPage = (page: number) => {
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    return limitedAccounts.slice(start, end);
  };

  return (
    <div className="relative w-full account-carousel-container">
      <Carousel.Root 
        page={currentPage}
        onPageChange={(e) => setCurrentPage(e.page)}
        slideCount={totalPages}
      >
        <Carousel.ItemGroup>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <Carousel.Item key={pageIndex} index={pageIndex}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 py-4">
                {getAccountsForPage(pageIndex).map((account) => (
                  <Card
                    key={account.id}
                    id={account.id}
                    title={account.title}
                    description={account.description}
                    price={account.price}
                    imageUrl={account.image_url}
                    href={`/account/${account.id}`}
                    createdAt={account.created_at}
                    mainAcc={account.main_acc}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel.ItemGroup>

        {totalPages > 1 && (
          <>
            <Carousel.PrevTrigger className="account-carousel-nav account-carousel-nav-prev">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Carousel.PrevTrigger>

            <Carousel.NextTrigger className="account-carousel-nav account-carousel-nav-next">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Carousel.NextTrigger>

            {/* Dots indicator */}
            <div className="account-carousel-dots">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  className={`account-carousel-dot ${currentPage === index ? 'active' : ''}`}
                  onClick={() => setCurrentPage(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </Carousel.Root>
    </div>
  );
};

