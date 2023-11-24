import React from "react";
import AssistantButton from "@/components/AssistantButton/AssistantButton";
import Image from "next/image";

export default function page() {
  return (
    <div>
      {/* <div className="bg-white flex justify-center items-center text-2xl h-screen gap-2">
        SiriGPT
      </div> */}
      <img src="/bg.png" />
      <div className="absolute bottom-0 right-0 pb-10 pr-10">
        <AssistantButton />
      </div>
    </div>
  );
}
