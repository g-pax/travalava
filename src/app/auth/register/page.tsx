"use client";

import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

export default function RegisterPageWrapper() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
