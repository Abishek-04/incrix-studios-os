import { DesignStage, DevStage, DesignType, DevType, Priority, Status } from '@/types';

/**
 * Project Configuration System
 * Defines stages, fields, tabs, and styling for each project type
 */

export const projectConfigs = {
  design: {
    label: 'Design Project',
    icon: 'Palette',
    stages: [
      DesignStage.Briefing,
      DesignStage.Concept,
      DesignStage.Design,
      DesignStage.Review,
      DesignStage.Approved,
      DesignStage.Delivered
    ],
    stageColors: {
      [DesignStage.Briefing]: 'blue',
      [DesignStage.Concept]: 'purple',
      [DesignStage.Design]: 'amber',
      [DesignStage.Review]: 'orange',
      [DesignStage.Approved]: 'emerald',
      [DesignStage.Delivered]: 'green'
    },
    fields: {
      // Overview Tab
      type: {
        label: 'Design Type',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: DesignType.Logo, label: 'Logo' },
          { value: DesignType.Banner, label: 'Banner' },
          { value: DesignType.Thumbnail, label: 'Thumbnail' },
          { value: DesignType.UIMockup, label: 'UI Mockup' },
          { value: DesignType.Branding, label: 'Branding Package' },
          { value: DesignType.SocialMedia, label: 'Social Media Graphics' }
        ]
      },
      assignedDesigner: {
        label: 'Designer',
        type: 'user-select',
        required: true,
        tab: 'overview',
        roleFilter: ['designer', 'manager']
      },
      title: {
        label: 'Project Title',
        type: 'text',
        required: true,
        tab: 'overview',
        placeholder: 'e.g., YouTube Channel Logo Redesign'
      },
      description: {
        label: 'Description',
        type: 'textarea',
        required: false,
        tab: 'overview',
        placeholder: 'Brief description of the design project...'
      },
      priority: {
        label: 'Priority',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: Priority.High, label: 'High' },
          { value: Priority.Medium, label: 'Medium' },
          { value: Priority.Low, label: 'Low' }
        ]
      },
      status: {
        label: 'Status',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: Status.NotStarted, label: 'Not Started' },
          { value: Status.InProgress, label: 'In Progress' },
          { value: Status.Done, label: 'Done' },
          { value: Status.Blocked, label: 'Blocked' }
        ]
      },
      dueDate: {
        label: 'Due Date',
        type: 'date',
        required: true,
        tab: 'overview'
      },
      relatedContentProject: {
        label: 'Related Content Project',
        type: 'project-select',
        required: false,
        tab: 'overview',
        projectTypeFilter: ['content']
      },
      // Design Tab
      briefing: {
        label: 'Design Brief',
        type: 'textarea',
        required: false,
        tab: 'design',
        placeholder: 'Client requirements, target audience, purpose...'
      },
      dimensions: {
        label: 'Dimensions',
        type: 'text',
        required: false,
        tab: 'design',
        placeholder: 'e.g., 1920x1080, 1080x1080'
      },
      colorScheme: {
        label: 'Color Scheme',
        type: 'text',
        required: false,
        tab: 'design',
        placeholder: 'e.g., #FF5733, #3498DB, #2ECC71'
      },
      brandGuidelines: {
        label: 'Brand Guidelines',
        type: 'textarea',
        required: false,
        tab: 'design',
        placeholder: 'Brand fonts, logo usage rules, color palette...'
      },
      conceptNotes: {
        label: 'Concept Notes',
        type: 'textarea',
        required: false,
        tab: 'design',
        placeholder: 'Initial concepts, mood boards, inspiration...'
      },
      designFiles: {
        label: 'Design Files',
        type: 'file-list',
        required: false,
        tab: 'design',
        fileTypes: ['.fig', '.psd', '.ai', '.sketch', '.svg', '.png', '.jpg']
      },
      // Review Tab
      reviewNotes: {
        label: 'Review Notes',
        type: 'textarea',
        required: false,
        tab: 'review',
        placeholder: 'Feedback from client/manager...'
      }
    },
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'Info' },
      { id: 'design', label: 'Design', icon: 'Palette' },
      { id: 'review', label: 'Review', icon: 'MessageSquare' },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
      { id: 'discussion', label: 'Discussion', icon: 'MessageCircle' }
    ],
    defaultStage: DesignStage.Briefing,
    defaultStatus: Status.NotStarted,
    defaultPriority: Priority.Medium
  },

  dev: {
    label: 'Development Project',
    icon: 'Code',
    stages: [
      DevStage.Planning,
      DevStage.Development,
      DevStage.Testing,
      DevStage.CodeReview,
      DevStage.QA,
      DevStage.Deployed
    ],
    stageColors: {
      [DevStage.Planning]: 'slate',
      [DevStage.Development]: 'blue',
      [DevStage.Testing]: 'purple',
      [DevStage.CodeReview]: 'amber',
      [DevStage.QA]: 'orange',
      [DevStage.Deployed]: 'emerald'
    },
    fields: {
      // Overview Tab
      type: {
        label: 'Development Type',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: DevType.Feature, label: 'New Feature' },
          { value: DevType.Bugfix, label: 'Bug Fix' },
          { value: DevType.Refactor, label: 'Refactor' },
          { value: DevType.Infrastructure, label: 'Infrastructure' },
          { value: DevType.Optimization, label: 'Optimization' }
        ]
      },
      assignedDeveloper: {
        label: 'Developer',
        type: 'user-select',
        required: true,
        tab: 'overview',
        roleFilter: ['developer', 'manager']
      },
      title: {
        label: 'Project Title',
        type: 'text',
        required: true,
        tab: 'overview',
        placeholder: 'e.g., Add User Authentication System'
      },
      description: {
        label: 'Description',
        type: 'textarea',
        required: false,
        tab: 'overview',
        placeholder: 'Brief description of the development work...'
      },
      priority: {
        label: 'Priority',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: Priority.High, label: 'High' },
          { value: Priority.Medium, label: 'Medium' },
          { value: Priority.Low, label: 'Low' }
        ]
      },
      status: {
        label: 'Status',
        type: 'select',
        required: true,
        tab: 'overview',
        options: [
          { value: Status.NotStarted, label: 'Not Started' },
          { value: Status.InProgress, label: 'In Progress' },
          { value: Status.Done, label: 'Done' },
          { value: Status.Blocked, label: 'Blocked' }
        ]
      },
      dueDate: {
        label: 'Due Date',
        type: 'date',
        required: true,
        tab: 'overview'
      },
      relatedContentProject: {
        label: 'Related Content Project',
        type: 'project-select',
        required: false,
        tab: 'overview',
        projectTypeFilter: ['content']
      },
      estimatedHours: {
        label: 'Estimated Hours',
        type: 'number',
        required: false,
        tab: 'overview',
        min: 0,
        step: 0.5
      },
      actualHours: {
        label: 'Actual Hours',
        type: 'number',
        required: false,
        tab: 'overview',
        min: 0,
        step: 0.5
      },
      // Technical Tab
      requirements: {
        label: 'Requirements',
        type: 'textarea',
        required: false,
        tab: 'technical',
        placeholder: 'User stories, acceptance criteria, functional requirements...'
      },
      technicalSpec: {
        label: 'Technical Specification',
        type: 'textarea',
        required: false,
        tab: 'technical',
        placeholder: 'Architecture, APIs, database schema, libraries...'
      },
      repository: {
        label: 'Repository',
        type: 'text',
        required: false,
        tab: 'technical',
        placeholder: 'e.g., github.com/org/repo'
      },
      branch: {
        label: 'Branch',
        type: 'text',
        required: false,
        tab: 'technical',
        placeholder: 'e.g., feature/user-auth'
      },
      pullRequest: {
        label: 'Pull Request',
        type: 'text',
        required: false,
        tab: 'technical',
        placeholder: 'PR URL or number'
      },
      testingNotes: {
        label: 'Testing Notes',
        type: 'textarea',
        required: false,
        tab: 'technical',
        placeholder: 'Test cases, edge cases, manual testing steps...'
      },
      deploymentNotes: {
        label: 'Deployment Notes',
        type: 'textarea',
        required: false,
        tab: 'technical',
        placeholder: 'Deployment steps, environment variables, migration scripts...'
      }
    },
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'Info' },
      { id: 'technical', label: 'Technical', icon: 'Code' },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
      { id: 'discussion', label: 'Discussion', icon: 'MessageCircle' }
    ],
    defaultStage: DevStage.Planning,
    defaultStatus: Status.NotStarted,
    defaultPriority: Priority.Medium
  }
};

/**
 * Get configuration for a project type
 * @param {string} projectType - 'design' or 'dev'
 * @returns {Object} Project configuration
 */
export const getProjectConfig = (projectType) => {
  return projectConfigs[projectType] || null;
};

/**
 * Get fields for a specific tab
 * @param {string} projectType - 'design' or 'dev'
 * @param {string} tabId - Tab identifier
 * @returns {Object} Fields for that tab
 */
export const getTabFields = (projectType, tabId) => {
  const config = getProjectConfig(projectType);
  if (!config) return {};

  return Object.entries(config.fields)
    .filter(([_, field]) => field.tab === tabId)
    .reduce((acc, [key, field]) => ({ ...acc, [key]: field }), {});
};

/**
 * Get color class for a stage
 * @param {string} projectType - 'design' or 'dev'
 * @param {string} stage - Stage name
 * @returns {string} Tailwind color name
 */
export const getStageColor = (projectType, stage) => {
  const config = getProjectConfig(projectType);
  return config?.stageColors[stage] || 'gray';
};

/**
 * Validate required fields for a project
 * @param {string} projectType - 'design' or 'dev'
 * @param {Object} projectData - Project data object
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export const validateProjectData = (projectType, projectData) => {
  const config = getProjectConfig(projectType);
  if (!config) return { valid: false, missing: ['Invalid project type'] };

  const missing = [];
  Object.entries(config.fields).forEach(([key, field]) => {
    if (field.required && !projectData[key]) {
      missing.push(field.label);
    }
  });

  return {
    valid: missing.length === 0,
    missing
  };
};
