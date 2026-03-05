const STAGE_PRIMARY_DATE_FIELD = {
  Backlog: 'dueDate',
  Scripting: 'shootDate',
  Shooting: 'shootDate',
  Editing: 'editDate',
  Review: 'uploadDoneDate',
  Done: 'uploadDoneDate'
};

const STRICT_STAGE_DATES = new Set(['Scripting', 'Shooting', 'Editing', 'Review', 'Done']);

function toValidTimestamp(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) && ts > 0 ? ts : null;
  }

  return null;
}

export function getProjectStageDate(project) {
  const primaryField = STAGE_PRIMARY_DATE_FIELD[project?.stage] || 'dueDate';
  const primaryStageDate = toValidTimestamp(project?.[primaryField]);
  if (primaryStageDate) return primaryStageDate;

  // For production stages, require the matching stage date field.
  // This prevents showing a different date (like due date) as stage date.
  if (STRICT_STAGE_DATES.has(project?.stage)) {
    return null;
  }

  // Backlog (and unknown stages) can still use due date as fallback.
  return toValidTimestamp(project?.dueDate) || toValidTimestamp(project?.lastUpdated);
}

export function getProjectStageMonthKey(project) {
  const ts = getProjectStageDate(project);
  if (!ts) return null;
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
