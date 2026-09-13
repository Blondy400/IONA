"use client";

import dynamic from "next/dynamic";

const AddItemClient = dynamic(() => import("./AddItemClient"), {
  ssr: false,
});

export default function AddItemPage() {
  return <AddItemClient />;
}