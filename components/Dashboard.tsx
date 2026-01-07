import React, { useMemo } from 'react';
import { Project, Role, Stage, Status, User, Platform } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertCircle, CheckCircle, Clock, Activity, Flame, Calendar, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  currentUser: User;
  users?: User[]; // Optional list of all users for Manager view
}

// Helper to calculate quota progress
const calculateProgress = (user: User, allProjects: Project[]) => {
    if (!user.quota) return null;

    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on period
    if (user.quota.period === 'weekly') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startDate.setDate(diff);
        startDate.setHours(0,0,0,0);
    } else {
        startDate.setDate(1); // 1st of month
        startDate.setHours(0,0,0,0);
    }

    const userProjects = allProjects.filter(p => 
        p.creator === user.name && 
        p.stage === Stage.Done && 
        p.lastUpdated >= startDate.getTime()
    );

    // In Progress for "Potential" check
    const pipelineProjects = allProjects.filter(p =>
        p.creator === user.name &&
        p.stage !== Stage.Done &&
        p.stage !== Stage.Backlog
    );

    const longFormActual = userProjects.filter(p => p.platform === Platform.YouTube).length;
    const shortFormActual = userProjects.filter(p => p.platform !== Platform.YouTube).length;

    const longFormPipeline = pipelineProjects.filter(p => p.platform === Platform.YouTube).length;
    const shortFormPipeline = pipelineProjects.filter(p => p.platform !== Platform.YouTube).length;

    return {
        long: {
            actual: longFormActual,
            target: user.quota.longVideo,
            pipeline: longFormPipeline,
            percent: Math.min(100, (longFormActual / Math.max(1, user.quota.longVideo)) * 100)
        },
        short: {
            actual: shortFormActual,
            target: user.quota.shortVideo,
            pipeline: shortFormPipeline,
            percent: Math.min(100, (shortFormActual / Math.max(1, user.quota.shortVideo)) * 100)
        }
    };
};

const Dashboard: React.FC<DashboardProps> = ({ projects, currentUser, users }) => {
  const isManager = currentUser.role === 'manager';

  // --- Manager Stats ---
  const managerKpis = useMemo(() => {
    const totalVolume = projects.filter(p => p.stage === Stage.Done).reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const stuck = projects.filter(p => {
        const isStuck = (Date.now() - p.lastUpdated) > (48 * 60 * 60 * 1000);
        return isStuck && p.status !== Status.Done;
    }).length;
    const urgent = projects.filter(p => (p.dueDate - Date.now()) < (3 * 24 * 60 * 60 * 1000) && p.stage !== Stage.Done).length;
    const doneCount = projects.filter(p => p.stage === Stage.Done).length;
    const totalCount = projects.length;
    const successRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    return { totalVolume, stuck, urgent, successRate };
  }, [projects]);

  const workloadData = useMemo(() => {
    const creators: Record<string, number> = {};
    projects.forEach(p => {
        if(p.status === Status.InProgress) {
            creators[p.creator] = (creators[p.creator] || 0) + 1;
        }
    });
    return Object.entries(creators).map(([name, count]) => ({ name, count, risk: count > 3 }));
  }, [projects]);

  // --- Personal Stats (Creator/Editor) ---
  const personalStats = useMemo(() => {
      const myProjects = projects.filter(p => p.creator === currentUser.name || p.editor === currentUser.name);
      const pending = myProjects.filter(p => p.stage !== Stage.Done).length;
      const completed = myProjects.filter(p => p.stage === Stage.Done).length;
      const nextDeadline = myProjects
        .filter(p => p.stage !== Stage.Done)
        .sort((a,b) => a.dueDate - b.dueDate)[0];
      
      const quotaProgress = calculateProgress(currentUser, projects);

      return { pending, completed, nextDeadline, quotaProgress };
  }, [projects, currentUser]);


  if (!isManager) {
      // --- CREATOR / EDITOR DASHBOARD ---
      return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hello, {currentUser.name}</h1>
                    <p className="text-[#666]">Here is what's on your plate today.</p>
                </div>
                {personalStats.quotaProgress && (
                     <div className="text-right">
                         <span className="text-xs text-[#666] uppercase tracking-wider block mb-1">Current Goal Period</span>
                         <span className="text-sm font-mono text-indigo-400 capitalize">{currentUser.quota?.period}</span>
                     </div>
                )}
            </div>

            {/* Goal Progress Section (Only for Creators with Quota) */}
            {personalStats.quotaProgress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-semibold">Long Form Goals</h3>
                                <p className="text-xs text-[#666]">YouTube Originals</p>
                            </div>
                            <div className={`p-2 rounded-lg ${personalStats.quotaProgress.long.percent >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#252525] text-[#666]'}`}>
                                <Target size={18} />
                            </div>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-bold text-white">{personalStats.quotaProgress.long.actual}<span className="text-[#444] text-lg">/{personalStats.quotaProgress.long.target}</span></span>
                            <span className="text-xs text-[#666]">{personalStats.quotaProgress.long.pipeline} in pipeline</span>
                        </div>
                        <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${personalStats.quotaProgress.long.percent}%` }} />
                        </div>
                    </div>

                    <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-semibold">Short Form Goals</h3>
                                <p className="text-xs text-[#666]">Reels, TikTok, Shorts</p>
                            </div>
                            <div className={`p-2 rounded-lg ${personalStats.quotaProgress.short.percent >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#252525] text-[#666]'}`}>
                                <Target size={18} />
                            </div>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                             <span className="text-3xl font-bold text-white">{personalStats.quotaProgress.short.actual}<span className="text-[#444] text-lg">/{personalStats.quotaProgress.short.target}</span></span>
                            <span className="text-xs text-[#666]">{personalStats.quotaProgress.short.pipeline} in pipeline</span>
                        </div>
                        <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: `${personalStats.quotaProgress.short.percent}%` }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Active Tasks</p>
                        <span className="text-4xl font-bold text-white">{personalStats.pending}</span>
                    </div>
                    <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Completed</p>
                        <span className="text-4xl font-bold text-white">{personalStats.completed}</span>
                    </div>
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Next Deadline</p>
                         {personalStats.nextDeadline ? (
                             <div>
                                 <div className="text-lg font-bold text-white truncate max-w-[150px]">{personalStats.nextDeadline.title}</div>
                                 <div className="text-xs text-amber-500 mt-1">Due in {Math.ceil((personalStats.nextDeadline.dueDate - Date.now()) / (1000 * 60 * 60 * 24))} days</div>
                             </div>
                         ) : (
                             <span className="text-lg text-[#666] italic">No deadlines</span>
                         )}
                    </div>
                    <div className="p-4 rounded-full bg-amber-500/10 text-amber-400">
                        <Calendar size={24} />
                    </div>
                </div>
            </div>
            
            {/* Simple Personal Task List */}
            <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl">
                 <h3 className="text-white font-semibold mb-4">My Priority Queue</h3>
                 <div className="space-y-3">
                     {projects
                        .filter(p => (p.creator === currentUser.name || p.editor === currentUser.name) && p.stage !== Stage.Done)
                        .slice(0, 5)
                        .map(p => (
                             <div key={p.id} className="flex items-center justify-between p-3 bg-[#151515] rounded-lg border border-[#2a2a2a]">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${p.priority === 'High' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                    <span className="text-sm text-white">{p.title}</span>
                                </div>
                                <span className="text-xs text-[#666] uppercase">{p.stage}</span>
                             </div>
                        ))}
                     {personalStats.pending === 0 && <div className="text-[#555] text-sm italic">All caught up!</div>}
                 </div>
            </div>
        </div>
      );
  }

  // --- MANAGER DASHBOARD ---
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Studio Overview</h1>
        <p className="text-[#666]">Real-time production metrics and resource allocation.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-5 rounded-2xl flex items-center justify-between group hover:border-[#444] transition-colors">
            <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Production Volume</p>
                <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-white">{managerKpis.totalVolume}</span>
                    <span className="text-sm text-[#444]">min</span>
                </div>
            </div>
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle size={20} />
            </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-5 rounded-2xl flex items-center justify-between group hover:border-[#444] transition-colors">
            <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Pipeline Success</p>
                <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-white">{managerKpis.successRate}%</span>
                </div>
            </div>
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                <Activity size={20} />
            </div>
        </div>

        <div className={`bg-[#1e1e1e] border p-5 rounded-2xl flex items-center justify-between group transition-colors
            ${managerKpis.urgent ? 'border-amber-500/30' : 'border-[#2f2f2f] hover:border-[#444]'}`}>
            <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Urgent (3 Days)</p>
                <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-bold ${managerKpis.urgent ? 'text-amber-400' : 'text-white'}`}>{managerKpis.urgent}</span>
                </div>
            </div>
            <div className={`p-3 rounded-full ${managerKpis.urgent ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-[#333] text-[#666]'}`}>
                <Clock size={20} />
            </div>
        </div>

        <div className={`bg-[#1e1e1e] border p-5 rounded-2xl flex items-center justify-between group transition-colors
            ${managerKpis.stuck > 0 ? 'border-rose-500/30' : 'border-[#2f2f2f] hover:border-[#444]'}`}>
            <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-1">Stuck (&gt;48h)</p>
                <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-bold ${managerKpis.stuck > 0 ? 'text-rose-400' : 'text-white'}`}>{managerKpis.stuck}</span>
                </div>
            </div>
            <div className={`p-3 rounded-full ${managerKpis.stuck > 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-[#333] text-[#666]'}`}>
                <AlertCircle size={20} />
            </div>
        </div>
      </div>

        {/* TEAM ACCOUNTABILITY SECTION */}
        <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl">
            <div className="flex items-center space-x-2 mb-6">
                <Target size={20} className="text-indigo-400" />
                <h3 className="text-white font-semibold">Creator Accountability & Goals</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users?.filter(u => u.role === 'creator').map(creator => {
                    const progress = calculateProgress(creator, projects);
                    if (!progress) return null;

                    const longRisk = progress.long.actual < progress.long.target && progress.long.pipeline === 0;
                    const shortRisk = progress.short.actual < progress.short.target && progress.short.pipeline === 0;
                    const isBehind = longRisk || shortRisk;

                    return (
                        <div key={creator.id} className="bg-[#151515] border border-[#2f2f2f] rounded-xl p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${creator.avatarColor}`}>
                                        {creator.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{creator.name}</div>
                                        <div className="text-[10px] text-[#666] uppercase">{creator.quota?.period} Quota</div>
                                    </div>
                                </div>
                                {isBehind ? (
                                    <span className="flex items-center space-x-1 text-xs text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                                        <AlertTriangle size={12} /> <span>Behind</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                        <CheckCircle size={12} /> <span>On Track</span>
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#888]">Long Form (YouTube)</span>
                                        <span className="text-white font-mono">{progress.long.actual}/{progress.long.target}</span>
                                    </div>
                                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${longRisk ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${progress.long.percent}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#888]">Short Form (Vertical)</span>
                                        <span className="text-white font-mono">{progress.short.actual}/{progress.short.target}</span>
                                    </div>
                                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${shortRisk ? 'bg-rose-500' : 'bg-pink-500'}`} style={{ width: `${progress.short.percent}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Creator Load / Burnout Risk */}
         <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl">
            <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-white font-semibold">Active Workload & Burnout Risk</h3>
                <Flame size={16} className="text-[#666]" />
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                            {workloadData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.risk ? '#ef4444' : '#6366f1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-[#1e1e1e] border border-[#2f2f2f] p-6 rounded-2xl">
            <h3 className="text-white font-semibold mb-6">Efficiency Analytics</h3>
            <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg border border-[#2a2a2a]">
                    <span className="text-sm text-[#888]">Avg. Scripting Time</span>
                    <span className="text-sm font-mono text-white">4.2 hrs</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg border border-[#2a2a2a]">
                    <span className="text-sm text-[#888]">Avg. Editing Time</span>
                    <span className="text-sm font-mono text-white">12.5 hrs</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg border border-[#2a2a2a]">
                    <span className="text-sm text-[#888]">Bottleneck Stage</span>
                    <span className="text-sm font-mono text-rose-400">Review (Wait Time)</span>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;