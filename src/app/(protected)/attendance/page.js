'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  Building2, Home, Palmtree, Clock, LogOut, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Users, Calendar, Filter
} from 'lucide-react';

const ease = [0.23, 1, 0.32, 1];

const STATUS = {
  office: { label: 'In Office', icon: Building2, color: '#22c55e', bg: '#22c55e20' },
  wfh: { label: 'WFH', icon: Home, color: '#3b82f6', bg: '#3b82f620' },
  leave: { label: 'On Leave', icon: Palmtree, color: '#ef4444', bg: '#ef444420' },
  half_day: { label: 'Half Day', icon: Clock, color: '#f59e0b', bg: '#f59e0b20' },
};

const CELL_COLORS = { office: '#22c55e', wfh: '#3b82f6', leave: '#ef4444', half_day: '#f59e0b', weekend: '#6b7280', empty: 'transparent' };

function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isWeekend(dateStr) { const d = new Date(dateStr + 'T00:00:00'); return d.getDay() === 0 || d.getDay() === 6; }
function fmtTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function getDaysInMonth(year, month) {
  const days = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= count; i++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    days.push({ day: i, dateStr, isWeekend: isWeekend(dateStr) });
  }
  return days;
}

// ─── Check-in Widget ──────────────────────────────────────────────────────────
function CheckInWidget({ todayRecord, onCheckIn, onCheckOut }) {
  const [notes, setNotes] = useState('');
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isCheckedIn = !!todayRecord;
  const statusCfg = isCheckedIn ? STATUS[todayRecord.status] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }}
      className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>{greeting}! 👋</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dateLabel}</p>
        </div>
        {isCheckedIn && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: statusCfg.bg }}>
              <statusCfg.icon size={16} style={{ color: statusCfg.color }} />
              <span className="text-[13px] font-semibold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
            </div>
            {todayRecord.checkInTime && (
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>In: {fmtTime(todayRecord.checkInTime)}</span>
            )}
            {todayRecord.checkOutTime && (
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Out: {fmtTime(todayRecord.checkOutTime)}</span>
            )}
            {!todayRecord.checkOutTime && todayRecord.status !== 'leave' && (
              <button onClick={onCheckOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: 'var(--bg-input)', color: 'var(--danger)', border: '1px solid var(--border)' }}>
                <LogOut size={13} /> Check Out
              </button>
            )}
          </div>
        )}
      </div>

      {!isCheckedIn ? (
        <>
          <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>How are you working today?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(STATUS).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={key} onClick={() => onCheckIn(key, notes)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  <Icon size={16} /> {cfg.label}
                </button>
              );
            })}
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional — reason for leave, etc.)"
            className="w-full px-3 py-2 rounded-xl text-[12px] outline-none" style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </>
      ) : (
        <div className="text-[13px]" style={{ color: 'var(--success)' }}>✓ You're checked in for today</div>
      )}
    </motion.div>
  );
}

// ─── Personal Heatmap ─────────────────────────────────────────────────────────
function PersonalHeatmap({ records, year, month }) {
  const days = getDaysInMonth(year, month);
  const recordMap = Object.fromEntries(records.map(r => [r.date, r]));

  const stats = { office: 0, wfh: 0, leave: 0, half_day: 0, total: 0 };
  records.forEach(r => { stats[r.status] = (stats[r.status] || 0) + 1; stats.total++; });
  const workDays = days.filter(d => !d.isWeekend).length;
  const pct = workDays > 0 ? Math.round((stats.total / workDays) * 100) : 0;

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>My Attendance</h3>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--primary)' }}>{pct}% attendance</span>
      </div>
      {/* Stats */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: cfg.color }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{cfg.label}: {stats[key]}</span>
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} className="text-center text-[9px] font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
        {/* Offset for first day */}
        {(() => {
          const firstDay = new Date(year, month, 1).getDay();
          const offset = firstDay === 0 ? 6 : firstDay - 1;
          return Array(offset).fill(null).map((_, i) => <div key={`off-${i}`} />);
        })()}
        {days.map(d => {
          const rec = recordMap[d.dateStr];
          const color = d.isWeekend ? CELL_COLORS.weekend : rec ? CELL_COLORS[rec.status] : CELL_COLORS.empty;
          const isToday = d.dateStr === toDateStr(new Date());
          return (
            <div key={d.day} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold relative"
              style={{ background: d.isWeekend ? 'var(--bg-input)' : rec ? color + '20' : 'transparent', color: rec ? color : d.isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)', border: isToday ? `2px solid var(--primary)` : '1px solid var(--border-light)' }}
              title={rec ? `${STATUS[rec.status].label}${rec.notes ? ': ' + rec.notes : ''}` : d.isWeekend ? 'Weekend' : 'No check-in'}>
              {d.day}
              {rec && <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Manager Team Grid ────────────────────────────────────────────────────────
function TeamGrid({ allRecords, users, year, month, teamFilter }) {
  const [expanded, setExpanded] = useState(null);
  const days = getDaysInMonth(year, month);

  // Group users by team/role
  const teams = useMemo(() => {
    const roleTeam = { creator: 'Content', editor: 'Editing', designer: 'Design', developer: 'Dev', manager: 'Management', superadmin: 'Management' };
    const grouped = {};
    users.forEach(u => {
      const roles = Array.isArray(u.roles) && u.roles.length ? u.roles : [u.role];
      const team = roleTeam[roles[0]] || 'Other';
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(u);
    });
    return grouped;
  }, [users]);

  const recordMap = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      const key = `${r.userId}-${r.date}`;
      map[key] = r;
    });
    return map;
  }, [allRecords]);

  const filteredTeams = teamFilter === 'all' ? teams : { [teamFilter]: teams[teamFilter] || [] };

  // Today stats
  const todayStr = toDateStr(new Date());
  const todayRecords = allRecords.filter(r => r.date === todayStr);
  const todayStats = { office: 0, wfh: 0, leave: 0, half_day: 0, none: 0 };
  todayRecords.forEach(r => todayStats[r.status]++);
  todayStats.none = users.filter(u => !['superadmin'].some(r => (u.roles || [u.role]).includes(r))).length - todayRecords.length;

  return (
    <div>
      {/* Today strip */}
      <div className="flex flex-wrap gap-3 mb-5 px-1">
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#22c55e20', color: '#22c55e' }}>🏢 {todayStats.office} In Office</span>
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#3b82f620', color: '#3b82f6' }}>🏠 {todayStats.wfh} WFH</span>
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>🌴 {todayStats.leave} Leave</span>
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#f59e0b20', color: '#f59e0b' }}>½ {todayStats.half_day} Half Day</span>
        {todayStats.none > 0 && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>⬜ {todayStats.none} Not Checked In</span>}
      </div>

      {/* Team sections */}
      {Object.entries(filteredTeams).map(([teamName, members]) => {
        if (!members?.length) return null;
        return (
          <div key={teamName} className="mb-6">
            <h3 className="text-[13px] font-bold mb-3 px-1" style={{ color: 'var(--text-secondary)' }}>{teamName} Team</h3>
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {/* Day headers */}
              <div className="flex items-center border-b overflow-x-auto" style={{ borderColor: 'var(--border-light)' }}>
                <div className="w-36 shrink-0 px-3 py-2 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Name</div>
                {days.map(d => (
                  <div key={d.day} className="w-8 shrink-0 text-center text-[9px] font-bold py-2"
                    style={{ color: d.isWeekend ? 'var(--text-muted)' : d.dateStr === toDateStr(new Date()) ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {d.day}
                  </div>
                ))}
              </div>

              {/* User rows */}
              {members.map(member => {
                const isExpanded = expanded === member.id;
                const memberRecords = allRecords.filter(r => r.userId === member.id);
                const mStats = { office: 0, wfh: 0, leave: 0, half_day: 0 };
                memberRecords.forEach(r => mStats[r.status]++);
                const workDays = days.filter(d => !d.isWeekend).length;
                const attended = mStats.office + mStats.wfh + mStats.half_day;
                const pct = workDays > 0 ? Math.round((attended / workDays) * 100) : 0;

                return (
                  <div key={member.id}>
                    {/* Row */}
                    <div className="flex items-center border-b cursor-pointer overflow-x-auto"
                      style={{ borderColor: 'var(--border-light)' }}
                      onClick={() => setExpanded(isExpanded ? null : member.id)}>
                      <div className="w-36 shrink-0 px-3 py-2.5 flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${member.avatarColor || 'bg-indigo-500'}`}>
                          {member.name?.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[12px] font-semibold block" style={{ color: 'var(--text)' }}>{member.name}</span>
                          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                        </div>
                        {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      {days.map(d => {
                        const rec = recordMap[`${member.id}-${d.dateStr}`];
                        const color = d.isWeekend ? CELL_COLORS.weekend : rec ? CELL_COLORS[rec.status] : CELL_COLORS.empty;
                        return (
                          <div key={d.day} className="w-8 h-8 shrink-0 flex items-center justify-center"
                            title={rec ? `${STATUS[rec.status].label}${rec.notes ? ': ' + rec.notes : ''}` : d.isWeekend ? 'Weekend' : 'No check-in'}>
                            <div className="w-5 h-5 rounded-md" style={{
                              background: d.isWeekend ? 'var(--bg-input)' : rec ? color : 'transparent',
                              border: !d.isWeekend && !rec ? '1px dashed var(--border)' : 'none',
                              opacity: d.isWeekend ? 0.5 : 1,
                            }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease }} className="overflow-hidden">
                          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border-light)', background: 'var(--bg-input)' }}>
                            <div className="flex gap-6 mb-3 flex-wrap">
                              {Object.entries(STATUS).map(([key, cfg]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ background: cfg.color }} />
                                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{cfg.label}: {mStats[key]}</span>
                                </div>
                              ))}
                              <span className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>Attendance: {pct}%</span>
                            </div>
                            {/* Mini calendar */}
                            <div className="grid grid-cols-7 gap-1 max-w-xs">
                              {['M','T','W','T','F','S','S'].map((d,i) => (
                                <div key={i} className="text-center text-[8px] font-bold py-0.5" style={{ color: 'var(--text-muted)' }}>{d}</div>
                              ))}
                              {(() => {
                                const firstDay = new Date(year, month, 1).getDay();
                                const offset = firstDay === 0 ? 6 : firstDay - 1;
                                return Array(offset).fill(null).map((_, i) => <div key={`off-${i}`} />);
                              })()}
                              {days.map(d => {
                                const rec = recordMap[`${member.id}-${d.dateStr}`];
                                const color = d.isWeekend ? CELL_COLORS.weekend : rec ? CELL_COLORS[rec.status] : CELL_COLORS.empty;
                                return (
                                  <div key={d.day} className="aspect-square rounded flex items-center justify-center text-[9px] font-semibold"
                                    style={{ background: d.isWeekend ? 'var(--bg-card)' : rec ? color + '25' : 'var(--bg-card)', color: rec ? color : 'var(--text-muted)', border: `1px solid var(--border-light)` }}>
                                    {d.day}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myRecords, setMyRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const roles = user ? (Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role]) : [];
  const isManager = roles.some(r => ['superadmin', 'manager'].includes(r));

  const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
  const today = toDateStr(now);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [myRes, todayRes, usersRes] = await Promise.all([
        fetchWithAuth(`/api/attendance?userId=${user.id}&month=${monthStr}`).then(r => r.json()),
        fetchWithAuth(`/api/attendance?date=${today}`).then(r => r.json()),
        fetchWithAuth('/api/users').then(r => r.json()),
      ]);
      setMyRecords(myRes.records || []);
      setAllUsers(usersRes.users || usersRes || []);
      const todayRecs = todayRes.records || [];
      setTodayRecord(todayRecs.find(r => r.userId === user.id) || null);

      if (isManager) {
        const allRes = await fetchWithAuth(`/api/attendance?month=${monthStr}`).then(r => r.json());
        setAllRecords(allRes.records || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user, monthStr, today, isManager]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeMonth = (dir) => {
    const d = new Date(year, month + dir);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const handleCheckIn = async (status, notes) => {
    try {
      const res = await fetchWithAuth('/api/attendance', { method: 'POST', body: JSON.stringify({ date: today, status, notes }) });
      const data = await res.json();
      if (data.record) {
        setTodayRecord(data.record);
        setMyRecords(prev => [...prev.filter(r => r.date !== today), data.record]);
        loadData();
      }
    } catch (err) { console.error(err); }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      const res = await fetchWithAuth(`/api/attendance/${todayRecord.id}`, { method: 'PATCH', body: JSON.stringify({ checkOutTime: true }) });
      const data = await res.json();
      if (data.record) setTodayRecord(data.record);
    } catch (err) { console.error(err); }
  };

  if (loading || !user) return <LoadingScreen />;

  const teamNames = [...new Set(allUsers.map(u => {
    const r = (Array.isArray(u.roles) && u.roles.length ? u.roles : [u.role])[0];
    return { creator: 'Content', editor: 'Editing', designer: 'Design', developer: 'Dev', manager: 'Management', superadmin: 'Management' }[r] || 'Other';
  }))];

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>Attendance</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>Track your daily check-ins and team attendance</p>
      </motion.div>

      {/* Check-in widget */}
      <CheckInWidget todayRecord={todayRecord} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />

      {/* Month picker */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}><ChevronLeft size={16} /></button>
        <span className="text-[15px] font-bold min-w-[160px] text-center" style={{ color: 'var(--text)' }}>{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}><ChevronRight size={16} /></button>

        {isManager && (
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
            className="ml-auto px-3 py-2 rounded-xl text-[12px] font-medium outline-none border"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <option value="all">All Teams</option>
            {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Personal heatmap (always shown) */}
      <PersonalHeatmap records={myRecords} year={year} month={month} />

      {/* Manager: Team grid */}
      {isManager && (
        <div>
          <h2 className="text-[16px] font-black mb-4" style={{ color: 'var(--text)' }}>
            <Users size={18} className="inline mr-2" style={{ color: 'var(--primary)' }} />
            Team Attendance
          </h2>
          <TeamGrid allRecords={allRecords} users={allUsers} year={year} month={month} teamFilter={teamFilter} />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 flex-wrap px-1">
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ background: cfg.color }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Weekend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ border: '1px dashed var(--border)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>No Check-in</span>
        </div>
      </div>
    </div>
  );
}
