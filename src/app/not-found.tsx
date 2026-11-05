"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    window.location.replace("/roam-stays/#stays");
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>Redirecting...</main>;
}
