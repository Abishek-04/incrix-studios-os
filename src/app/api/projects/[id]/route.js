import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import DeletedItem from '@/models/DeletedItem';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import {
  buildCurrentUserContext,
  canManageAllProjects,
  canViewProject,
  normalizeRole,
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

function sanitizeProjectPayload(rawProject = {}) {
  const plain = sanitizeDoc(rawProject);
  const now = Date.now();
  const merged = { ...plain };

  if (Object.prototype.hasOwnProperty.call(merged, 'title')) merged.title = String(merged.title || '').trim();
  if (Object.prototype.hasOwnProperty.call(merged, 'topic')) merged.topic = String(merged.topic || '').trim();
  if (Object.prototype.hasOwnProperty.call(merged, 'creator')) merged.creator = String(merged.creator || '').trim() || 'Unassigned';

  if (Object.prototype.hasOwnProperty.call(merged, 'editors') || Object.prototype.hasOwnProperty.call(merged, 'editor')) {
    const normalizedEditors = normalizeEditors(merged);
    merged.editors = normalizedEditors;
    merged.editor = normalizedEditors[0] || 'Unassigned';
  }

  if (!Object.prototype.hasOwnProperty.call(merged, 'lastUpdated') || typeof merged.lastUpdated !== 'number') {
    merged.lastUpdated = now;
  }

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

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    const project = await Project.findOne({ id: decodeURIComponent(id) });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (!canViewProject(project, currentUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, project: serializeProject(project) });
  } catch (error) {
    console.error('[API] Error fetching project:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const projectId = decodeURIComponent(id);
    const body = await request.json();

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    const incoming = body?.project || body?.updates || {};
    const updates = sanitizeProjectPayload(incoming);

    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const currentProject = await Project.findOne({ id: projectId });
    if (!currentProject) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (!canManageAllProjects(currentUser) && !canViewProject(currentProject, currentUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const isManager = canManageAllProjects(currentUser);
    const isProjectCreator = normalizeText(currentProject.creator) === normalizeText(currentUser.name);

    // Only managers can reassign creator
    if (!isManager && Object.prototype.hasOwnProperty.call(updates, 'creator')) {
      if (normalizeText(updates.creator) !== normalizeText(currentProject.creator)) {
        return NextResponse.json({ success: false, error: 'Only managers can reassign project creator' }, { status: 403 });
      }
      updates.creator = currentProject.creator;
    }

    // Only project creator or managers can assign editors
    const wantsEditorUpdate = Object.prototype.hasOwnProperty.call(updates, 'editors') || Object.prototype.hasOwnProperty.call(updates, 'editor');
    if (wantsEditorUpdate && !isManager && !isProjectCreator) {
      return NextResponse.json({ success: false, error: 'Only managers or the project creator can assign editors' }, { status: 403 });
    }

    const incomingLastUpdated = Number(updates.lastUpdated || Date.now());
    const currentLastUpdated = Number(currentProject.lastUpdated || 0);
    if (incomingLastUpdated < currentLastUpdated) {
      const latestProject = await Project.findOne({ id: projectId });
      return NextResponse.json({ success: true, stale: true, project: serializeProject(latestProject) });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { id: projectId, $or: [{ lastUpdated: { $lte: incomingLastUpdated } }, { lastUpdated: { $exists: false } }] },
      { $set: updates },
      { new: true }
    );

    if (!updatedProject) {
      const latestProject = await Project.findOne({ id: projectId });
      return NextResponse.json({ success: true, stale: true, project: latestProject ? serializeProject(latestProject) : null });
    }

    return NextResponse.json({ success: true, project: serializeProject(updatedProject) });
  } catch (error) {
    console.error('[API] Error updating project:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const projectId = decodeURIComponent(id);

    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = buildContextFromUser(authUser);
    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can delete projects' }, { status: 403 });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const recycledItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'project',
      entityId: projectId,
      source: 'projects_api',
      deletedBy: authUser.name || 'system',
      data: sanitizeDoc(project),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    });

    await Project.deleteOne({ id: projectId });

    return NextResponse.json({ success: true, deletedItemId: recycledItem.id });
  } catch (error) {
    console.error('[API] Error deleting project:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete project' }, { status: 500 });
  }
}
