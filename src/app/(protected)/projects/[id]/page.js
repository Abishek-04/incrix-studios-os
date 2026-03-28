'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  ArrowLeft, Calendar, Clock, User, Users, Film, Edit3, Save, Trash2,
  ChevronRight, CheckCircle, AlertTriangle, Link as LinkIcon, ExternalLink,
  FileText, MessageSquare
} from 'lucide-react';

const ease = [0.23, 1, 0.32, 1];

const STAGE_CONFIG = {
  Backlog: { emoji: '💡', color: '#64748b', label: 'Ideas' },
  Scripting: { emoji: '📝', color: '#3b82f6', label: 'Planning' },
  Shooting: { emoji: '🎬', color: '#8b5cf6', label: 'Creating' },
  Editing: { emoji: '✂️', color: '#f59e0b', label: 'Editing' },
  Review: { emoji: '👀', color: '#f97316', label: 'Review' },
  Publishing: { emoji: '🚀', color: '#06b6d4', label: 'Publishing' },
  Done: { emoji: '✅', color: '#22c55e', label: 'Done' },
};

const STAGE_ORDER = ['Backlog', 'Scripting', 'Shooting', 'Editing', 'Review', 'Publishing', 'Done'];

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDue(ts) {
  if (!ts) return null;
  const days = Math.ceil((new Date(ts) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)} days overdue`, urgent: true };
  if (days === 0) return { text: 'Due today', urgent: false };
  if (days === 1) return { text: 'Due tomorrow', urgent: false };
  return { text: `${days} days left`, urgent: false };
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchWithAuth(`/api/projects/${id}`).then(r => r.json()),
      fetchWithAuth('/api/state').then(r => r.json()),
    ]).then(([projData, stateData]) => {
      setProject(projData.project || projData);
      setChannels(stateData.channels || []);
      setUsers(stateData.users || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading || !user) return <LoadingScreen />;
  if (!project) return (
    <div className="min-h-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>Project not found</p>
        <button onClick={() => router.back()} className="mt-3 text-sm font-medium" style={{ color: 'var(--primary)' }}>Go back</button>
      </div>
    </div>
  );

  const stage = STAGE_CONFIG[project.stage] || STAGE_CONFIG.Backlog;
  const due = fmtDue(project.dueDate);
  const stageIdx = STAGE_ORDER.indexOf(project.stage);
  const progress = stageIdx >= 0 ? Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 100) : 0;
  const channel = channels.find(c => c.id === project.channelId);
  const isDone = project.stage === 'Done';

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      {/* Back button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-medium mb-5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={16} /> Back
        </button>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{stage.emoji}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black" style={{ color: isDone ? 'var(--success)' : 'var(--text)' }}>{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-md" style={{ background: stage.color + '15', color: stage.color }}>{stage.label}</span>
                {project.platform && (
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                    {project.platform === 'youtube' ? '▶ YouTube' : project.platform === 'instagram' ? '◉ Instagram' : project.platform === 'course' ? '🎓 Course' : project.platform}
                  </span>
                )}
                {project.contentFormat && (
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {project.contentFormat === 'ShortForm' ? 'Short Form' : project.contentFormat === 'LongForm' ? 'Long Form' : project.contentFormat}
                  </span>
                )}
                {project.priority === 'High' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>Urgent</span>
                )}
              </div>
            </div>
          </div>
          {due && (
            <p className="text-[13px] font-medium mt-2" style={{ color: due.urgent ? 'var(--danger)' : 'var(--text-muted)' }}>
              {due.urgent && '⚠ '}{due.text}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/board')} className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            View on Board
          </button>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25, ease }}
        className="rounded-2xl border p-5 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>Pipeline Progress</span>
          <span className="text-[13px] font-black" style={{ color: stage.color }}>{progress}%</span>
        </div>
        <div className="flex items-center gap-1">
          {STAGE_ORDER.map((s, i) => {
            const sc = STAGE_CONFIG[s];
            const isActive = i <= stageIdx;
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full h-2 rounded-full" style={{ background: isActive ? sc.color : 'var(--bg-input)' }} />
                <span className="text-[9px] font-medium hidden md:block" style={{ color: isActive ? sc.color : 'var(--text-muted)' }}>{sc.emoji}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Topic / Description */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.25, ease }}
            className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <FileText size={16} /> Topic / Brief
            </h3>
            <p className="text-[14px] leading-relaxed" style={{ color: project.topic && project.topic !== 'To be decided' ? 'var(--text)' : 'var(--text-muted)' }}>
              {project.topic || 'No topic set'}
            </p>
          </motion.div>

          {/* Script */}
          {project.script && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text)' }}>📝 Script</h3>
              <pre className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{project.script}</pre>
            </motion.div>
          )}

          {/* Technical Notes */}
          {project.technicalNotes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text)' }}>🔧 Technical Notes</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{project.technicalNotes}</p>
            </motion.div>
          )}

          {/* Tasks checklist */}
          {project.tasks?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <CheckCircle size={16} /> Tasks ({project.tasks.filter(t => t.done).length}/{project.tasks.length})
              </h3>
              <div className="space-y-2">
                {project.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    {t.done ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />}
                    <span className="text-[13px]" style={{ color: t.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comments */}
          {project.comments?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <MessageSquare size={16} /> Comments ({project.comments.length})
              </h3>
              <div className="space-y-3">
                {project.comments.map((c, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: 'var(--primary)' }}>
                      {c.authorName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>{c.authorName}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmtDate(c.createdAt)}</span>
                      </div>
                      <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Links */}
          {(project.reviewLink || project.publishedLink) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <LinkIcon size={16} /> Links
              </h3>
              <div className="space-y-2">
                {project.reviewLink && (
                  <a href={project.reviewLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                    style={{ color: 'var(--primary)' }}>
                    <ExternalLink size={14} /> Review Link
                  </a>
                )}
                {project.publishedLink && (
                  <a href={project.publishedLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                    style={{ color: 'var(--primary)' }}>
                    <ExternalLink size={14} /> Published Link
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right sidebar — metadata */}
        <div className="space-y-5">
          {/* Team card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.25, ease }}
            className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Users size={16} /> People
            </h3>
            <div className="space-y-3">
              {/* Creator */}
              <PersonRow user={users.find(u => u.name === project.creator)} name={project.creator} role="Creator" />
              {/* Editors */}
              {project.editors?.map(edName => (
                <PersonRow key={edName} user={users.find(u => u.name === edName)} name={edName} role="Editor" />
              ))}
              {/* Designer */}
              {project.assignedDesigner && (
                <PersonRow user={users.find(u => u.name === project.assignedDesigner)} name={project.assignedDesigner} role="Designer" />
              )}
              {/* Developer */}
              {project.assignedDeveloper && (
                <PersonRow user={users.find(u => u.name === project.assignedDeveloper)} name={project.assignedDeveloper} role="Developer" />
              )}
            </div>
          </motion.div>

          {/* Details card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.25, ease }}
            className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text)' }}>Details</h3>
            <div className="space-y-3">
              <DetailRow icon={Film} label="Platform" value={project.platform || '—'} />
              <DetailRow label="Stage" value={project.stage} color={stage.color} emoji={stage.emoji} />
              <DetailRow label="Status" value={project.status || '—'} />
              <DetailRow label="Priority" value={project.priority || 'Medium'} color={project.priority === 'High' ? 'var(--danger)' : 'var(--text-secondary)'} />
              {channel && <DetailRow label="Channel" value={channel.name} />}
              <DetailRow label="ID" value={project.id} mono />
            </div>
          </motion.div>

          {/* Dates card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25, ease }}
            className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Calendar size={16} /> Dates
            </h3>
            <div className="space-y-3">
              <DetailRow icon={Clock} label="Due Date" value={fmtDate(project.dueDate)} color={due?.urgent ? 'var(--danger)' : undefined} />
              {project.shootDate && <DetailRow label="Shoot Date" value={fmtDate(project.shootDate)} />}
              {project.editDate && <DetailRow label="Edit Date" value={fmtDate(project.editDate)} />}
              {project.uploadDoneDate && <DetailRow label="Upload Date" value={fmtDate(project.uploadDoneDate)} />}
              <DetailRow label="Last Updated" value={fmtDate(project.lastUpdated)} />
              <DetailRow label="Created" value={fmtDate(project.createdAt)} />
            </div>
          </motion.div>

          {/* Metrics */}
          {(project.metrics?.views || project.durationMinutes) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.25, ease }}
              className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--text)' }}>📊 Metrics</h3>
              <div className="space-y-3">
                {project.durationMinutes > 0 && <DetailRow label="Duration" value={`${project.durationMinutes} min`} />}
                {project.metrics?.views > 0 && <DetailRow label="Views" value={project.metrics.views.toLocaleString()} />}
                {project.metrics?.likes > 0 && <DetailRow label="Likes" value={project.metrics.likes.toLocaleString()} />}
                {project.metrics?.comments > 0 && <DetailRow label="Comments" value={project.metrics.comments.toLocaleString()} />}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonRow({ user, name, role }) {
  if (!name || name === 'Unassigned') return null;
  const roleColors = { Creator: '#8b5cf6', Editor: '#f59e0b', Designer: '#ec4899', Developer: '#06b6d4' };
  return (
    <div className="flex items-center gap-3 py-1.5">
      {user?.profilePhoto ? (
        <img src={user.profilePhoto} alt={name} className="w-9 h-9 rounded-full object-cover ring-1 ring-[var(--border)]" />
      ) : (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${user?.avatarColor || 'bg-violet-500'}`}>
          {name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</div>
        <div className="text-[10px] font-medium" style={{ color: roleColors[role] || 'var(--text-muted)' }}>{role}</div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, color, emoji, mono }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {Icon && <Icon size={13} />} {label}
      </span>
      <span className={`text-[12px] font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: color || 'var(--text)' }}>
        {emoji && <span className="mr-1">{emoji}</span>}{value}
      </span>
    </div>
  );
}
