"use client";

import Image from "next/image";
import HomePage from "./home/HomePage";
import Navbar from "../components/layout/navbar";
import WelcomeAlert from "../components/alerts/WelcomeAlert";

export default function Home() {
  return (
    <div>
      <WelcomeAlert />
      <Navbar />
      <div className="relative w-full">
        <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden bg-black">
          <Image
            src="/images/banner.png"
            alt="Banner"
            fill
            className="object-contain"
            sizes="100vw"
            quality={100}
            priority
          />
        </div>
      </div>
      <HomePage />
    </div>
  );
}
