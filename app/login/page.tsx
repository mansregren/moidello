import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { pickBg, HERO_POOL } from "@/lib/session-background";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const bg = await pickBg("login", HERO_POOL);

  return (
    <>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="relative flex-1 flex items-center justify-center min-h-screen px-6"
      >
        <div className="absolute inset-0">
          <Image
            src={bg}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <LoginForm initialError={error} />
      </main>
    </>
  );
}
