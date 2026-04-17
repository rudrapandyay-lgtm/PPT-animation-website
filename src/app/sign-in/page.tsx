import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthForm
      mode="sign-in"
      title="Welcome back"
      eyebrow="Sign in"
      subtitle="Access your workspace, update deck motion, and send polished presentation links to clients."
    />
  );
}
