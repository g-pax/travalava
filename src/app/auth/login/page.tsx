import { Suspense } from "react";
import LoginPage from "./LoginPage";

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
