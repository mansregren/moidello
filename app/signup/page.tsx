import { redirect } from "next/navigation";

export default function SignupPage() {
  // Magic link login handles new and returning users in the same flow.
  redirect("/login");
}
