'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Zap,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  TrendingUp,
  Users,
  Target,
  Clock,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';

/**
 * ManyChat-Style Automation Builder
 * Professional automation creation with templates and visual flow
 */
export default function ManyChatStyleBuilder({ channel, currentUser }) {
  const [activeView, setActiveView] = useState('templates'); // templates, automations, create
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [automations, setAutomations] = useState([]);

  const templates = [
    {
      id: 'welcome-dm',
      name: 'Welcome New Followers',
      description: 'Send a welcome DM when someone comments for the first time',
      icon: '👋',
      category: 'Engagement',
      estimatedReach: '500-1000/month',
      keywords: ['hi', 'hello', 'hey'],
      message: 'Hi {{username}}! 👋 Thanks for engaging with our content! Check out our latest offers...'
    },
    {
      id: 'product-inquiry',
      name: 'Product Inquiry Response',
      description: 'Auto-respond to product-related comments',
      icon: '🛍️',
      category: 'Sales',
      estimatedReach: '200-500/month',
      keywords: ['price', 'buy', 'purchase', 'order'],
      message: 'Hey {{username}}! 😊 I sent you all the details about {{post_caption}} in your DMs!'
    },
    {
      id: 'giveaway',
      name: 'Giveaway Entry Confirmation',
      description: 'Confirm giveaway entries automatically',
      icon: '🎁',
      category: 'Growth',
      estimatedReach: '1000-5000/month',
      keywords: ['giveaway', 'enter', 'win'],
      message: "🎉 You're entered, {{username}}! Good luck! Winners announced on {{post_link}}"
    },
    {
      id: 'lead-magnet',
      name: 'Lead Magnet Delivery',
      description: 'Send free resources to engaged users',
      icon: '📚',
      category: 'Lead Gen',
      estimatedReach: '300-800/month',
      keywords: ['free', 'download', 'guide'],
      message: "Here's your free guide, {{username}}! 📥 [Download Link]"
    },
    {
      id: 'support',
      name: 'Customer Support',
      description: 'Direct support questions to DMs',
      icon: '💬',
      category: 'Support',
      estimatedReach: '100-300/month',
      keywords: ['help', 'support', 'question', 'issue'],
      message: 'Hi {{username}}, I can help! Let me send you details in DM...'
    },
    {
      id: 'testimonial',
      name: 'Testimonial Collection',
      description: 'Collect testimonials from happy customers',
      icon: '⭐',
      category: 'Social Proof',
      estimatedReach: '50-150/month',
      keywords: ['love', 'amazing', 'great', 'best'],
      message: 'So glad you love it, {{username}}! 💕 Mind sharing a review? DM sent!'
    }
  ];

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveView('create');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Instagram Automations</h2>
          <p className="text-[#999] text-sm mt-1">
            Create powerful comment → DM automations in minutes
          </p>
        </div>
        <button
          onClick={() => setActiveView('create')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Automation
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-4 border-b border-[#2a2a2a]">
        {[
          { id: 'templates', label: 'Templates', icon: Sparkles },
          { id: 'automations', label: 'My Automations', icon: Zap },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === tab.id
                ? 'text-indigo-400 border-indigo-400'
                : 'text-[#999] border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeView === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Template Categories */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {['All', 'Engagement', 'Sales', 'Growth', 'Lead Gen', 'Support'].map(category => (
                <button
                  key={category}
                  className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[#999] rounded-lg text-sm whitespace-nowrap hover:border-indigo-500/50 hover:text-white transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  onClick={() => handleUseTemplate(template)}
                >
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{template.icon}</div>
                    <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-full">
                      {template.category}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-white font-semibold mb-2 group-hover:text-indigo-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-[#666] text-sm mb-4">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-1 text-xs text-[#999]">
                      <Users className="w-3 h-3" />
                      {template.estimatedReach}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#999]">
                      <Target className="w-3 h-3" />
                      {template.keywords.length} keywords
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                    Use Template
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Custom Template CTA */}
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-xl p-8 text-center">
              <Zap className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Need a Custom Automation?
              </h3>
              <p className="text-[#999] mb-4">
                Create your own automation from scratch with our visual builder
              </p>
              <button
                onClick={() => setActiveView('create')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Build Custom Automation
              </button>
            </div>
          </motion.div>
        )}

        {activeView === 'automations' && (
          <motion.div
            key="automations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AutomationsList automations={automations} />
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AutomationBuilder
              template={selectedTemplate}
              onBack={() => setActiveView('templates')}
              onSave={(automation) => {
                setAutomations([...automations, automation]);
                setActiveView('automations');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Automations List Component
function AutomationsList({ automations }) {
  if (automations.length === 0) {
    return (
      <div className="text-center py-16">
        <Zap className="w-16 h-16 text-[#666] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Automations Yet
        </h3>
        <p className="text-[#999]">
          Create your first automation to start auto-responding to comments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {automations.map(automation => (
        <div
          key={automation.id}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#333] transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold">{automation.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  automation.active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-[#2a2a2a] text-[#666]'
                }`}>
                  {automation.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-[#666] text-sm mb-4">{automation.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-[#666]">Triggered</div>
                  <div className="text-white font-semibold">{automation.stats?.triggered || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666]">DMs Sent</div>
                  <div className="text-green-400 font-semibold">{automation.stats?.sent || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666]">Success Rate</div>
                  <div className="text-indigo-400 font-semibold">
                    {automation.stats?.successRate || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
                {automation.active ? (
                  <Pause className="w-4 h-4 text-amber-400" />
                ) : (
                  <Play className="w-4 h-4 text-green-400" />
                )}
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
                <Copy className="w-4 h-4 text-[#999]" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
                <Settings className="w-4 h-4 text-[#999]" />
              </button>
              <button className="p-2 hover:bg-red-500/20 rounded transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Automation Builder Component
function AutomationBuilder({ template, onBack, onSave }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    keywords: template?.keywords || [],
    message: template?.message || '',
    delay: 5
  });

  const handleSave = () => {
    const automation = {
      id: Date.now().toString(),
      ...formData,
      active: true,
      stats: { triggered: 0, sent: 0, successRate: 0 }
    };
    onSave(automation);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#999] rotate-180" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {template ? `Setup: ${template.name}` : 'Create Custom Automation'}
          </h2>
          <p className="text-[#999] text-sm">Configure your automation settings</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 space-y-6">
        {/* Automation Name */}
        <div>
          <label className="block text-white font-medium mb-2">Automation Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Welcome New Followers"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-white font-medium mb-2">Trigger Keywords</label>
          <p className="text-[#666] text-sm mb-3">
            DM will be sent when comment contains any of these keywords
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2"
              >
                {keyword}
                <button
                  onClick={() => {
                    const newKeywords = formData.keywords.filter((_, i) => i !== index);
                    setFormData({ ...formData, keywords: newKeywords });
                  }}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type keyword and press Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                setFormData({
                  ...formData,
                  keywords: [...formData.keywords, e.target.value.trim()]
                });
                e.target.value = '';
              }
            }}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Message Template */}
        <div>
          <label className="block text-white font-medium mb-2">DM Message</label>
          <p className="text-[#666] text-sm mb-3">
            Use variables: {`{{username}}, {{comment_text}}, {{post_link}}`}
          </p>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Hi {{username}}! Thanks for commenting..."
            rows={6}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Delay */}
        <div>
          <label className="block text-white font-medium mb-2">Send Delay (seconds)</label>
          <input
            type="number"
            value={formData.delay}
            onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) })}
            min="0"
            max="300"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Save & Activate
          </button>
        </div>
      </div>
    </div>
  );
}
