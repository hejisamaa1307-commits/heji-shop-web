"use client";
import Image from "next/image"
import { Carousel } from "@ark-ui/react/carousel"
import { useEffect, useState } from "react"

export const LocalCarousel = () => {
  const images = ["/images/carou_3.png" ];
  // "/images/anh_uc.jpg", "/images/carou_1.png", "/images/carou_2.png", 
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full">
      <Carousel.Root 
        page={currentPage}
        onPageChange={(e) => setCurrentPage(e.page)}
        slideCount={images.length}
      >
        <Carousel.ItemGroup>
          {images.map((image, index) => (
            <Carousel.Item key={index} index={index}>
              <div className="relative w-full h-96 md:h-[500px] overflow-hidden">
                <Image
                  src={image}
                  alt={`Slide ${index}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  quality={100}
                  priority={index === 0}
                />
              </div>
            </Carousel.Item>
          ))}
        </Carousel.ItemGroup>

        <Carousel.PrevTrigger className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Carousel.PrevTrigger>

        <Carousel.NextTrigger className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Carousel.NextTrigger>
      </Carousel.Root>
    </div>
  );
};
