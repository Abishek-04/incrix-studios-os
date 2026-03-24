import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import {
  buildCurrentUserContext,
  canManageAllProjects,
  filterProjectsForUser,
  normalizeRoles,
  normalizeText
} from '@/lib/projectAccess';

function toPlainObject(input) {
  if (!input) return {};
  if (typeof input.toObject === 'function') return input.toObject();
  if (input._doc && typeof input._doc === 'object') return { ...input._doc };
  return { ...input };
}

function stripMongoInternals(value) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => stripMongoInternals(item));
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === '_id' || key === '__v') continue;
      result[key] = stripMongoInternals(nestedValue);
    }
    return result;
  }
  return value;
}

function sanitizeDoc(input) {
  return stripMongoInternals(toPlainObject(input));
}

function normalizeEditors(projectData) {
  const list = [];
  if (Array.isArray(projectData?.editors)) list.push(...projectData.editors);
  if (projectData?.editor) list.push(projectData.editor);
  return Array.from(new Set(
    list.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => Boolean(v) && v !== 'Unassigned')
  ));
}

function sanitizeProjectPayload(rawProject = {}, { isCreate = false } = {}) {
  const plain = sanitizeDoc(rawProject);
  const now = Date.now();

  const base = isCreate
    ? {
        id: `PRJ-${now.toString().slice(-6)}`,
        title: 'New Untitled Project',
        topic: 'To be decided',
        vertical: 'software',
        platform: 'youtube',
        creator: 'Unassigned',
        editor: 'Unassigned',
        editors: [],
        stage: 'Backlog',
        status: 'Not Started',
        priority: 'Medium',
        lastUpdated: now,
        dueDate: now,
        shootDate: null,
        editDate: null,
        uploadDoneDate: null,
        reshootDone: false,
        reshootDate: null,
        durationMinutes: 0,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: false,
        archived: false
      }
    : {};

  const merged = { ...base, ...plain };
  merged.id = String(merged.id || '').trim() || base.id;
  merged.title = String(merged.title || '').trim() || base.title || 'New Untitled Project';
  merged.topic = String(merged.topic || '').trim() || base.topic || 'To be decided';
  merged.creator = String(merged.creator || '').trim() || 'Unassigned';
  delete merged.role;

  const normalizedEditors = normalizeEditors(merged);
  merged.editors = normalizedEditors;
  merged.editor = normalizedEditors[0] || 'Unassigned';

  if (typeof merged.lastUpdated !== 'number' || Number.isNaN(merged.lastUpdated)) merged.lastUpdated = now;
  if (typeof merged.dueDate !== 'number' || Number.isNaN(merged.dueDate)) merged.dueDate = merged.uploadDoneDate || now;

  return merged;
}

function serializeProject(project) {
  const plain = sanitizeDoc(project);
  const normalizedEditors = normalizeEditors(plain);
  return { ...plain, editors: normalizedEditors, editor: normalizedEditors[0] || 'Unassigned' };
}

function buildContextFromUser(user) {
  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

export async function GET(request) {
  try {
    await connectDB();

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    const projects = await Project.find({}).sort({ lastUpdated: -1 });

    return NextResponse.json({
      success: true,
      projects: filterProjectsForUser(projects.map((p) => serializeProject(p)), currentUser)
    });
  } catch (error) {
    console.error('[API] Error fetching projects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    const isManager = canManageAllProjects(currentUser);
    const isCreator = currentUser.role === 'creator' || (currentUser.roles || []).includes('creator');

    if (!isManager && !isCreator) {
      return NextResponse.json({ success: false, error: 'Only managers and creators can create projects' }, { status: 403 });
    }

    const payload = sanitizeProjectPayload(body?.project || {}, { isCreate: true });

    if (normalizeText(payload.creator) === 'unassigned' && currentUser.name) {
      payload.creator = currentUser.name;
    }

    if (!isManager) {
      if (!currentUser.name) {
        return NextResponse.json({ success: false, error: 'Creator identity is required' }, { status: 400 });
      }
      payload.creator = currentUser.name;
    }

    if (!isManager && normalizeText(payload.creator) !== normalizeText(currentUser.name)) {
      return NextResponse.json({ success: false, error: 'You can only create projects for yourself' }, { status: 403 });
    }

    const existing = await Project.findOne({ id: payload.id }).select('lastUpdated');
    if (existing && Number(existing.lastUpdated || 0) > Number(payload.lastUpdated || 0)) {
      const latest = await Project.findOne({ id: payload.id });
      return NextResponse.json({ success: true, stale: true, project: serializeProject(latest) });
    }

    const project = await Project.findOneAndUpdate(
      { id: payload.id },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, project: serializeProject(project) });
  } catch (error) {
    console.error('[API] Error creating project:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
