// Migration script: Convert existing Projects to Pages with block-based content
// Run with: node scripts/migrate-to-pages.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Convert project content to blocks
function convertToBlocks(project) {
  const blocks = [];
  let order = 0;

  // Convert topic to heading + paragraph
  if (project.topic) {
    blocks.push({
      id: `block-${Date.now()}-${order}`,
      type: 'heading',
      content: 'Brief',
      properties: { level: 2 },
      children: [],
      order: order++,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    blocks.push({
      id: `block-${Date.now()}-${order}`,
      type: 'paragraph',
      content: project.topic,
      properties: {},
      children: [],
      order: order++,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  // Convert script to paragraphs
  if (project.script) {
    blocks.push({
      id: `block-${Date.now()}-${order}`,
      type: 'heading',
      content: 'Script',
      properties: { level: 2 },
      children: [],
      order: order++,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const paragraphs = project.script.split('\n\n');
    for (const para of paragraphs) {
      if (para.trim()) {
        blocks.push({
          id: `block-${Date.now()}-${order}`,
          type: 'paragraph',
          content: para.trim(),
          properties: {},
          children: [],
          order: order++,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }
  }

  // Convert technical notes to callout
  if (project.technicalNotes) {
    blocks.push({
      id: `block-${Date.now()}-${order}`,
      type: 'callout',
      content: project.technicalNotes,
      properties: { backgroundColor: '#1e1e1e' },
      children: [],
      order: order++,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  return blocks;
}

async function migrateProjectsToPages() {
  console.log('\n🚀 Starting migration: Projects → Pages\n');

  try {
    await connectDB();

    // Import models
    const Project = mongoose.model('Project');
    const Page = mongoose.model('Page');

    // Get all projects
    const projects = await Project.find({});
    console.log(`📊 Found ${projects.length} projects to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      try {
        // Check if page already exists
        const existingPage = await Page.findOne({ id: project.id });
        if (existingPage) {
          console.log(`⏭️  Skipping ${project.title} (already migrated)`);
          continue;
        }

        // Convert content to blocks
        const blocks = convertToBlocks(project);
        const blockOrder = blocks.map(b => b.id);

        // Create new page
        await Page.create({
          id: project.id,
          title: project.title,
          type: 'project',
          icon: null,
          coverImage: null,

          // Block-based content
          blocks,
          blockOrder,

          // Custom properties (preserve existing project metadata)
          properties: {
            stage: { type: 'select', value: project.stage },
            status: { type: 'select', value: project.status },
            priority: { type: 'select', value: project.priority },
            platform: { type: 'select', value: project.platform },
            vertical: { type: 'select', value: project.vertical },
            contentFormat: { type: 'select', value: project.contentFormat },
            dueDate: { type: 'date', value: project.dueDate },
            channelId: { type: 'text', value: project.channelId },
            hasMographNeeds: { type: 'checkbox', value: project.hasMographNeeds }
          },

          // Legacy fields for backward compatibility
          stage: project.stage,
          status: project.status,
          priority: project.priority,
          creator: project.creator,
          editor: project.editor,

          // Assignees
          assignees: [
            project.creator && {
              userId: 'auto',
              userName: project.creator,
              role: 'creator',
              assignedAt: project.lastUpdated
            },
            project.editor && {
              userId: 'auto',
              userName: project.editor,
              role: 'editor',
              assignedAt: project.lastUpdated
            }
          ].filter(Boolean),

          dueDate: project.dueDate,

          // Permissions
          permissions: {
            owner: project.creator,
            editors: [project.creator, project.editor].filter(Boolean),
            viewers: [],
            public: false
          },

          // System
          archived: project.archived || false,
          deleted: false,
          createdBy: project.creator,
          createdAt: project.lastUpdated || Date.now(),
          updatedAt: project.lastUpdated || Date.now()
        });

        console.log(`✅ Migrated: ${project.title}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error migrating ${project.title}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${projects.length}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrateProjectsToPages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
