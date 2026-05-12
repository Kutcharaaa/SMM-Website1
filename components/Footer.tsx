export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <img
              src="/logo.png"
              alt="Ascend Service"
              className="h-14 w-auto mb-4"
            />

            <p className="text-zinc-400 text-sm leading-relaxed">
              Ascend Service is a modern social media growth platform
              built for creators, brands, agencies, and resellers.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>

            <div className="flex flex-col gap-3 text-sm text-zinc-400">
              <a href="/about" className="hover:text-blue-400">About</a>
              <a href="/contact" className="hover:text-blue-400">Contact</a>
              <a href="/support" className="hover:text-blue-400">Support</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Services</h3>

            <div className="flex flex-col gap-3 text-sm text-zinc-400">
              <a href="/services" className="hover:text-blue-400">All Services</a>
              <a href="/pricing" className="hover:text-blue-400">Pricing</a>
              <a href="/api" className="hover:text-blue-400">API Access</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>

            <div className="flex flex-col gap-3 text-sm text-zinc-400">
              <a href="/terms" className="hover:text-blue-400">Terms</a>
              <a href="/privacy" className="hover:text-blue-400">Privacy</a>
              <a href="/refund" className="hover:text-blue-400">Refund Policy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-col md:flex-row justify-between gap-4 text-sm text-zinc-500">
          <p>© 2026 Ascend Service. All rights reserved.</p>

          <p>Fast. Reliable. Built for growth.</p>
        </div>
      </div>
    </footer>
  );
}