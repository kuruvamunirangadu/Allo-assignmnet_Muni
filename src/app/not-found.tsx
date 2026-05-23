export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16 text-center">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">404</p>
        <h1 className="mt-3 font-display text-4xl text-white">Reservation not found</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          The requested reservation no longer exists or was never created.
        </p>
      </div>
    </main>
  );
}
