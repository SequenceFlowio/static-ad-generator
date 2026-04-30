"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdGenPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/generation/ads"); }, [router]);
  return null;
}
