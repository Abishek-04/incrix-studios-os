'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import { useToast } from '@/contexts/UIContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Plus, Pencil, Trash2, GraduationCap, User, X } from 'lucide-react';

export default function CoursesPage() {
  const { user: currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const showToast = useToast();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'superadmin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        fetchWithAuth('/api/courses'),
        fetchWithAuth('/api/users'),
      ]);
      const coursesData = await coursesRes.json();
      const usersData = await usersRes.json();
      setCourses(coursesData.courses || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const res = await fetchWithAuth('/api/courses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => [data.course, ...prev]);
        setShowDialog(false);
        showToast('Course created successfully');
      } else {
        showToast(data.error || 'Failed to create course');
      }
    } catch (error) {
      showToast('Failed to create course');
    }
  };

  const handleUpdate = async (courseId, formData) => {
    try {
      const res = await fetchWithAuth(`/api/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => prev.map((c) => (c.id === courseId ? data.course : c)));
        setEditingCourse(null);
        setShowDialog(false);
        showToast('Course updated successfully');
      } else {
        showToast(data.error || 'Failed to update course');
      }
    } catch (error) {
      showToast('Failed to update course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Delete this course?')) return;
    try {
      const res = await fetchWithAuth(`/api/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        showToast('Course deleted');
      } else {
        showToast(data.error || 'Failed to delete course');
      }
    } catch (error) {
      showToast('Failed to delete course');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap size={28} className="text-indigo-400" />
            Course Dashboard
          </h1>
          <p className="text-sm text-[#888] mt-1">Manage courses and assign course takers</p>
        </div>
        {isManager && (
          <button
            onClick={() => { setEditingCourse(null); setShowDialog(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} />
            Add Course
          </button>
        )}
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap size={48} className="mx-auto text-[#333] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No courses yet</h3>
          <p className="text-[#888] text-sm">Create your first course to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#333] transition-colors">
              {/* Thumbnail */}
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.name} className="w-full h-40 object-cover rounded-lg mb-4" />
              ) : (
                <div className="w-full h-40 bg-[#1e1e1e] rounded-lg mb-4 flex items-center justify-center">
                  <GraduationCap size={40} className="text-[#333]" />
                </div>
              )}

              {/* Info */}
              <h3 className="text-white font-semibold text-lg mb-1">{course.name}</h3>
              {course.description && (
                <p className="text-[#888] text-sm mb-3 line-clamp-2">{course.description}</p>
              )}

              {/* Course Taker */}
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-[#666]" />
                <span className="text-sm text-[#aaa]">
                  {course.courseTakerName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 ml-auto">
                  {course.status === 'in_progress' ? 'In Progress' : course.status === 'completed' ? 'Completed' : 'Planning'}
                </span>
              </div>

              {/* Actions */}
              {isManager && (
                <div className="flex gap-2 pt-3 border-t border-[#2a2a2a]">
                  <button
                    onClick={() => { setEditingCourse(course); setShowDialog(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#252525] hover:bg-[#2f2f2f] rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showDialog && (
        <CourseDialog
          course={editingCourse}
          users={users}
          onClose={() => { setShowDialog(false); setEditingCourse(null); }}
          onSubmit={(formData) => {
            if (editingCourse) {
              handleUpdate(editingCourse.id, formData);
            } else {
              handleCreate(formData);
            }
          }}
        />
      )}
    </div>
  );
}

function CourseDialog({ course, users, onClose, onSubmit }) {
  const [name, setName] = useState(course?.name || '');
  const [description, setDescription] = useState(course?.description || '');
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
  const [courseTakerId, setCourseTakerId] = useState(course?.courseTakerId || '');
  const [status, setStatus] = useState(course?.status || 'planning');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !courseTakerId) return;
    onSubmit({ name: name.trim(), description: description.trim(), thumbnail: thumbnail.trim(), courseTakerId, status });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{course ? 'Edit Course' : 'Add Course'}</h2>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-1.5">Course Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white placeholder-[#666] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              placeholder="e.g., React Masterclass"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-1.5">Course Taker *</label>
            <select
              value={courseTakerId}
              onChange={(e) => setCourseTakerId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              required
            >
              <option value="">Select Course Taker</option>
              {users.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white placeholder-[#666] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm resize-none"
              placeholder="Brief description of the course..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-1.5">Thumbnail URL</label>
            <input
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white placeholder-[#666] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              placeholder="https://..."
            />
          </div>

          {course && (
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || !courseTakerId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {course ? 'Update Course' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
}
