import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

export const dynamic = 'force-dynamic';
import DeletedItem from '@/models/DeletedItem';
import User from '@/models/User';
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
  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripMongoInternals(item));
  }

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
  if (Array.isArray(projectData?.editors)) {
    list.push(...projectData.editors);
  }
  if (projectData?.editor) {
    list.push(projectData.editor);
  }

  return Array.from(
    new Set(
      list
        .map((value) => (typeof value === 'string' ? value.trim() : value))
        .filter((value) => Boolean(value) && value !== 'Unassigned')
    )
  );
}

function sanitizeProjectPayload(rawProject = {}) {
  const plain = sanitizeDoc(rawProject);
  const now = Date.now();

  const merged = {
    ...plain
  };

  if (Object.prototype.hasOwnProperty.call(merged, 'title')) {
    merged.title = String(merged.title || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(merged, 'topic')) {
    merged.topic = String(merged.topic || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(merged, 'creator')) {
    merged.creator = String(merged.creator || '').trim() || 'Unassigned';
  }

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
  return {
    ...plain,
    editors: normalizedEditors,
    editor: normalizedEditors[0] || 'Unassigned'
  };
}

function buildUserLookup(id) {
  const normalized = String(id || '').trim();
  if (!normalized) return null;

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    return {
      $or: [
        { id: normalized },
        { _id: new mongoose.Types.ObjectId(normalized) }
      ]
    };
  }

  return { id: normalized };
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveCurrentUserFromRequest(request, body = null) {
  const { searchParams } = new URL(request.url);
  const raw = body?.currentUser || {};
  const requestedId = raw.id || raw._id || searchParams.get('userId') || '';
  const requestedName = typeof (raw.name || searchParams.get('userName') || '') === 'string'
    ? (raw.name || searchParams.get('userName') || '').trim()
    : '';

  let user = null;
  const lookup = buildUserLookup(requestedId);
  if (lookup) {
    user = await User.findOne(lookup).select('id name role roles');
  }

  if (!user && requestedName) {
    user = await User.findOne({
      name: { $regex: `^${escapeRegex(requestedName)}$`, $options: 'i' }
    }).select('id name role roles');
  }

  if (!user) {
    return buildCurrentUserContext({});
  }

  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

function hasUserContext(currentUser) {
  return Boolean(currentUser?.name || currentUser?.id || normalizeRoles(currentUser?.roles, currentUser?.role).length > 0);
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await resolveCurrentUserFromRequest(request);
    if (!hasUserContext(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const project = await Project.findOne({ id: decodeURIComponent(id) });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!canViewProject(project, currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project: serializeProject(project)
    });
  } catch (error) {
    console.error('[API] Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const projectId = decodeURIComponent(id);
    const body = await request.json();
    const currentUser = await resolveCurrentUserFromRequest(request, body);
    if (!hasUserContext(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const incoming = body?.project || body?.updates || {};
    const updates = sanitizeProjectPayload(incoming);

    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const currentProject = await Project.findOne({ id: projectId });
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!canManageAllProjects(currentUser) && !canViewProject(currentProject, currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const isManager = canManageAllProjects(currentUser);
    const isProjectCreator = normalizeText(currentProject.creator) === normalizeText(currentUser.name);
    const isSuperAdmin = normalizeRole(currentUser.role) === 'superadmin';

    // Only managers can reassign creator.
    if (!isManager && Object.prototype.hasOwnProperty.call(updates, 'creator')) {
      if (normalizeText(updates.creator) !== normalizeText(currentProject.creator)) {
        return NextResponse.json(
          { success: false, error: 'Only managers can reassign project creator' },
          { status: 403 }
        );
      }
      updates.creator = currentProject.creator;
    }

    // Only the project creator or managers can assign/reassign editors.
    const wantsEditorUpdate =
      Object.prototype.hasOwnProperty.call(updates, 'editors') ||
      Object.prototype.hasOwnProperty.call(updates, 'editor');
    const canAssignEditors = isManager || isProjectCreator;
    if (wantsEditorUpdate && !canAssignEditors) {
      return NextResponse.json(
        { success: false, error: 'Only managers or the project creator can assign editors' },
        { status: 403 }
      );
    }

    const incomingLastUpdated = Number(updates.lastUpdated || Date.now());
    const currentLastUpdated = Number(currentProject.lastUpdated || 0);
    if (incomingLastUpdated < currentLastUpdated) {
      const latestProject = await Project.findOne({ id: projectId });
      return NextResponse.json({
        success: true,
        stale: true,
        project: serializeProject(latestProject)
      });
    }

    const updatedProject = await Project.findOneAndUpdate(
      {
        id: projectId,
        $or: [
          { lastUpdated: { $lte: incomingLastUpdated } },
          { lastUpdated: { $exists: false } }
        ]
      },
      { $set: updates },
      { new: true }
    );

    if (!updatedProject) {
      const latestProject = await Project.findOne({ id: projectId });
      return NextResponse.json({
        success: true,
        stale: true,
        project: latestProject ? serializeProject(latestProject) : null
      });
    }

    return NextResponse.json({
      success: true,
      project: serializeProject(updatedProject)
    });
  } catch (error) {
    console.error('[API] Error updating project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const projectId = decodeURIComponent(id);
    const body = await request.json().catch(() => ({}));
    const currentUser = await resolveCurrentUserFromRequest(request, body);
    if (!hasUserContext(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Only managers can delete projects' },
        { status: 403 }
      );
    }

    const project = await Project.findOne({ id: projectId });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const recycledItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'project',
      entityId: projectId,
      source: 'projects_api',
      deletedBy: 'system',
      data: sanitizeDoc(project),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    });

    await Project.deleteOne({ id: projectId });

    return NextResponse.json({
      success: true,
      deletedItemId: recycledItem.id
    });
  } catch (error) {
    console.error('[API] Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
