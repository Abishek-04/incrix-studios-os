export const metadata = {
  title: 'Offline | #teamincrix',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Please reconnect to continue working. You can refresh this page once your internet is back.
        </p>
      </div>
    </main>
  );
}
