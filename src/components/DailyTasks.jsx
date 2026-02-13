import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Calendar as CalendarIcon, Clock } from 'lucide-react';

    tasks: DailyTask[];
    users: User[];
    currentUser: User;

const DailyTasks = ({ tasks, users, currentUser, onUpdateTasks }) => {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTask, setNewTask] = useState<Partial<DailyTask>>({
        timeSlot: 'AM',
        userId: currentUser.role === 'manager' ? users[0]?.id : currentUser.id,
        task: ''
    });

    const handleAddTask = () => {
        if (!newTask.task || !newTask.userId) return;

        const assignedUser = users.find(u => u.id === newTask.userId);

        const task: DailyTask = {
            id: 'task-' + Date.now(),
            date: filterDate,
            timeSlot: newTask.timeSlot as 'AM' | 'PM',
            userId: newTask.userId,
            userName: assignedUser?.name || 'Unknown',
            task: newTask.task,
            done: false
        };

        onUpdateTasks([...tasks, task]);
        setNewTask({ ...newTask, task: '' });
    };

    const toggleTask = (taskId: string) => {
        onUpdateTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (taskId: string) => {
        onUpdateTasks(tasks.filter(t => t.id !== taskId));
    };

    const filteredTasks = tasks.filter(t => t.date === filterDate);
    const amTasks = filteredTasks.filter(t => t.timeSlot === 'AM');
    const pmTasks = filteredTasks.filter(t => t.timeSlot === 'PM');

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Daily Tasks</h1>
                    <p className="text-[#888]">Track daily goals and schedules.</p>
                </div>

                <div className="flex items-center space-x-4 bg-[#151515] p-2 rounded-xl border border-[#222]">
                    <CalendarIcon size={18} className="text-[#666] ml-2" />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent text-white border-none outline-none p-1"
                    />
                </div>
            </div>

            {/* Add Task Form */}
            <div className="bg-[#151515] border border-[#222] rounded-xl p-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-2">
                        <div className="flex bg-[#0d0d0d] rounded-lg p-1 border border-[#333]">
                            <button
                                onClick={() => setNewTask({ ...newTask, timeSlot: 'AM' })}
                                className={`flex-1 py-1 text-xs font-bold rounded ${newTask.timeSlot === 'AM' ? 'bg-indigo-600 text-white' : 'text-[#666]'}`}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => setNewTask({ ...newTask, timeSlot: 'PM' })}
                                className={`flex-1 py-1 text-xs font-bold rounded ${newTask.timeSlot === 'PM' ? 'bg-indigo-600 text-white' : 'text-[#666]'}`}
                            >
                                PM
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <select
                            value={newTask.userId}
                            onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
                            className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            disabled={currentUser.role !== 'manager'}
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-6">
                        <input
                            type="text"
                            placeholder="Enter task description..."
                            value={newTask.task}
                            onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <button
                            onClick={handleAddTask}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AM Column */}
                <div className="bg-[#151515]/30 border border-[#222] rounded-xl p-6">
                    <div className="flex items-center mb-6">
                        <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg mr-3">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Morning (AM)</h3>
                        <span className="ml-auto text-xs font-mono text-[#999] bg-[#111] px-2 py-1 rounded">{amTasks.length} tasks</span>
                    </div>

                    <div className="space-y-3">
                        {amTasks.length === 0 && (
                            <div className="text-center py-8 text-[#999] text-sm italic">No tasks scheduled for AM</div>
                        )}
                        {amTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                        ))}
                    </div>
                </div>

                {/* PM Column */}
                <div className="bg-[#151515]/30 border border-[#222] rounded-xl p-6">
                    <div className="flex items-center mb-6">
                        <div className="bg-indigo-500/10 text-indigo-500 p-2 rounded-lg mr-3">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Afternoon (PM)</h3>
                        <span className="ml-auto text-xs font-mono text-[#999] bg-[#111] px-2 py-1 rounded">{pmTasks.length} tasks</span>
                    </div>

                    <div className="space-y-3">
                        {pmTasks.length === 0 && (
                            <div className="text-center py-8 text-[#999] text-sm italic">No tasks scheduled for PM</div>
                        )}
                        {pmTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskItem void, onDelete: (id: string) => void }> = ({ task, onToggle, onDelete }) => {
    return (
        <div className={`group flex items-center p-3 rounded-lg border transition-all ${task.done ? 'bg-[#0a0a0a] border-[#1f1f1f] opacity-60' : 'bg-[#1a1a1a] border-[#333] hover:border-[#555]'}`}>
            <button
                onClick={() => onToggle(task.id)}
                className={`mr-3 ${task.done ? 'text-green-500' : 'text-[#999] group-hover:text-[#666]'}`}
            >
                {task.done ? <CheckCircle size={20} /> : <Circle size={20} />}
            </button>
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${task.done ? 'text-[#666] line-through' : 'text-white'}`}>
                    {task.task}
                </div>
                <div className="text-xs text-[#999] mt-0.5 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 opacity-50"></span>
                    {task.userName}
                </div>
            </div>
            <button
                onClick={() => onDelete(task.id)}
                className="ml-2 text-[#999] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded hover:bg-[#252525]"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default DailyTasks;
