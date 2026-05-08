import Image from "next/image";
import { Header } from "@/components/layout/Header";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
            src="/images/bg/riviera.jpg"
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
