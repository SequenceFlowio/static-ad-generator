"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContentGenPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/generation/content"); }, [router]);
  return null;
}
