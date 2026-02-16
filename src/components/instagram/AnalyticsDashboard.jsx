'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Send, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

export default function AnalyticsDashboard({ channel }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    if (channel) {
      loadData();
    }
  }, [channel, timeRange]);

  async function loadData() {
    if (!channel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/instagram/automations?channelId=${channel.id}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!channel) {
    return (
      <div className="text-center text-[#999] py-12">
        Select an Instagram account from the Accounts tab
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Calculate totals
  const totalTriggered = rules.reduce((sum, rule) => sum + (rule.stats?.totalTriggered || 0), 0);
  const totalSent = rules.reduce((sum, rule) => sum + (rule.stats?.totalSent || 0), 0);
  const totalFailed = rules.reduce((sum, rule) => sum + (rule.stats?.totalFailed || 0), 0);
  const totalDeduped = rules.reduce((sum, rule) => sum + (rule.stats?.totalDeduped || 0), 0);

  const successRate = totalTriggered > 0 ? ((totalSent / totalTriggered) * 100).toFixed(1) : 0;
  const activeRules = rules.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#999]">Time Range:</span>
        <div className="flex gap-2">
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all', label: 'All Time' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#2a2a2a] text-[#999] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-sm text-[#999]">DMs Sent</div>
          </div>
          <div className="text-3xl font-bold text-white">{totalSent}</div>
          <div className="text-xs text-[#666] mt-1">
            {successRate}% success rate
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-sm text-[#999]">Triggered</div>
          </div>
          <div className="text-3xl font-bold text-white">{totalTriggered}</div>
          <div className="text-xs text-[#666] mt-1">
            Total automations triggered
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-sm text-[#999]">Deduped</div>
          </div>
          <div className="text-3xl font-bold text-white">{totalDeduped}</div>
          <div className="text-xs text-[#666] mt-1">
            Prevented duplicate messages
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-sm text-[#999]">Failed</div>
          </div>
          <div className="text-3xl font-bold text-white">{totalFailed}</div>
          <div className="text-xs text-[#666] mt-1">
            Failed to send
          </div>
        </div>
      </div>

      {/* Active Rules */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Active Automations</h3>
        </div>
        <div className="text-2xl font-bold text-white mb-2">{activeRules}</div>
        <div className="text-sm text-[#999]">
          {rules.length - activeRules} paused or draft
        </div>
      </div>

      {/* Performance by Rule */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance by Automation</h3>

        {rules.length === 0 ? (
          <div className="text-center text-[#999] py-8">
            No automations created yet
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="bg-[#151515] rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    <div className="text-sm text-[#666] mt-1">
                      {rule.status === 'active' ? (
                        <span className="text-green-400">● Active</span>
                      ) : (
                        <span className="text-[#666]">● {rule.status}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {rule.stats?.totalSent || 0}
                    </div>
                    <div className="text-xs text-[#666]">DMs sent</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-[#666]">Triggered</div>
                    <div className="text-white font-medium">
                      {rule.stats?.totalTriggered || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#666]">Sent</div>
                    <div className="text-green-400 font-medium">
                      {rule.stats?.totalSent || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#666]">Deduped</div>
                    <div className="text-amber-400 font-medium">
                      {rule.stats?.totalDeduped || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#666]">Failed</div>
                    <div className="text-red-400 font-medium">
                      {rule.stats?.totalFailed || 0}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {rule.stats?.totalTriggered > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{
                          width: `${((rule.stats.totalSent || 0) / rule.stats.totalTriggered) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-[#666] mt-1">
                      {(((rule.stats.totalSent || 0) / rule.stats.totalTriggered) * 100).toFixed(1)}%
                      success rate
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center text-[#999] py-8">
          Activity timeline coming soon...
        </div>
      </div>
    </div>
  );
}
