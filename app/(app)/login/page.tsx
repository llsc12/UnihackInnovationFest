import { Suspense } from "react";
import { LoginForm } from "./login-form";

// LoginForm reads useSearchParams() to honour ?mode=signup, which Next 15
// requires to be inside a <Suspense> boundary on prerenderable pages.
export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
