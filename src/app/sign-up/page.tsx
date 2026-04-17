import { redirect } from "next/navigation";

import { signUpAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthForm
      mode="sign-up"
      title="Create your premium workspace"
      eyebrow="Start free"
      subtitle="Launch a private workspace with premium templates, element-level motion control, and protected share links."
      action={signUpAction}
    />
  );
}
