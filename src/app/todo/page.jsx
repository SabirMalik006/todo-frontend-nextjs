"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TodoRedirectPage() {
  const router = useRouter();

  useEffect(() => {

    const lastBoardId = localStorage.getItem("lastBoardId");

    if (lastBoardId) {
      
      router.replace(`/todo/${lastBoardId}`);
    } else {
      
      console.warn("No saved board found in localStorage");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      <p>Redirecting to your board...</p>
    </div>
  );
}
