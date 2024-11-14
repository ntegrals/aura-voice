import React from "react";
import AssistantButton from "@/components/AssistantButton/AssistantButton";
import Image from "next/image";

export default function Page() {
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <main className="flex min-h-screen flex-col justify-center items-center p-24">
          <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
            <Image
              src="/font2.png"
              alt="Main Logo"
              width={650}
              height={100}
              priority
            />
          </div>
        </main>
        <div className="absolute bottom-0 right-0 pb-10 pr-10">
          <AssistantButton />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex min-h-screen flex-col items-center">
        <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="relative flex place-items-center w-[80vw] mb-16 before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
            <Image
              src="/font2.png"
              alt="Main Logo"
              width={300}
              height={50}
              priority
              className="w-full h-auto"
            />
          </div>
          <div className="w-full flex justify-center">
            <AssistantButton />
          </div>
        </div>
      </div>
    </>
  );
}
