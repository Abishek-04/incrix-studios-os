'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Instagram, Radio, TrendingUp, Target, BarChart3, ArrowUpRight, Megaphone } from 'lucide-react';

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

export default function MarketingPage() {
  return (
    <div className="min-h-full p-5 md:p-8" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>📣 Marketing</h1>
        <p className="text-base mt-1" style={{ color: 'var(--text-secondary)' }}>Campaigns, social media, and growth tracking</p>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <motion.div variants={fade}>
          <Link href="/instagram">
            <div className="rounded-3xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
                <Instagram size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Instagram Automation</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>DM automation, comment replies, and engagement tools</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Open <ArrowUpRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={fade}>
          <Link href="/channels">
            <div className="rounded-3xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <Radio size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Social Channels</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage connected YouTube, Instagram, and social accounts</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Open <ArrowUpRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={fade}>
          <Link href="/performance">
            <div className="rounded-3xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <BarChart3 size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Content Performance</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track content output, quotas, and team performance</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Open <ArrowUpRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Coming Soon */}
      <motion.div variants={fade} initial="hidden" animate="show" className="rounded-3xl border-2 border-dashed p-10 text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Campaigns & Analytics Coming Soon</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Campaign planner, ad tracking, lead funnels, and distribution analytics will be available here.
          For now, use the tools above to manage your marketing workflows.
        </p>
      </motion.div>
    </div>
  );
}
