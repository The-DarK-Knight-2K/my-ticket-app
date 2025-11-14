import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f9fafb] to-[#eef2f3] px-6 relative overflow-hidden">
      {/* Decorative blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#00BFA6]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#00BFA6]/10 rounded-full blur-3xl" />

      <section className="text-center max-w-5xl z-10">
        <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl font-semibold text-gray-900 mb-8 leading-tight">
          Design Stunning <span className="text-[#00BFA6]">Tickets</span> & Cards 🎨
        </h1>

        <p className="text-gray-600 text-xl sm:text-2xl md:text-3xl mb-14 leading-relaxed max-w-3xl mx-auto">
          Create, customize, and export printable designs effortlessly — a Canva-style experience made just for ticket creators.
        </p>

        {/* Canva-style button */}
        <Link href="/wizard" className="relative group inline-block select-none">
          {/* Outer glowing aura */}
          <div className="absolute inset-0 -inset-x-10 -inset-y-5 rounded-full bg-gradient-to-r from-[#00BFA6]/40 to-[#00a88c]/40 blur-3xl opacity-70 group-hover:opacity-90 transition-all duration-500" />
          
          {/* Button body */}
          <span className="relative inline-flex justify-center items-center min-w-[320px] sm:min-w-[360px] md:min-w-[420px] bg-gradient-to-r from-[#00BFA6] to-[#00a88c] text-white font-heading text-2xl sm:text-3xl px-16 py-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-2xl group-active:scale-95 group-hover:brightness-110">
            Start Designing →
          </span>
        </Link>

        <p className="mt-10 text-base sm:text-lg text-gray-500">
          No accounts. No clutter. Just creativity unleashed.
        </p>
      </section>
    </main>
  );
}
