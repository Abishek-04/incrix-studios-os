import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Send a text message via WhatsApp Business API
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} params.message - Message text
 * @returns {Promise<Object>} Response with messageId
 */
export async function sendWhatsAppMessage({ to, message }) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API credentials not configured');
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9+]/g, ''), // Clean phone number
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      phone: to,
    };
  } catch (error) {
    console.error('[WhatsApp] Send error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message');
  }
}

/**
 * Send a message using WhatsApp template (required for business accounts)
 * @param {Object} params
 * @param {string} params.to - Recipient phone number
 * @param {string} params.templateName - Approved template name
 * @param {Array} params.templateParams - Template parameters
 * @returns {Promise<Object>} Response with messageId
 */
export async function sendWhatsAppTemplate({ to, templateName, templateParams = [] }) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API credentials not configured');
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9+]/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en_US',
          },
          components: templateParams.length > 0 ? [
            {
              type: 'body',
              parameters: templateParams.map(param => ({
                type: 'text',
                text: param,
              })),
            },
          ] : [],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      phone: to,
      template: templateName,
    };
  } catch (error) {
    console.error('[WhatsApp] Template send error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp template');
  }
}

/**
 * Format notification into WhatsApp message text
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {string} Formatted message
 */
export function formatWhatsAppMessage(type, data) {
  const { projectTitle, projectId, commenterName, newStage, daysRemaining, date, timeSlot } = data;

  const messages = {
    'project-assignment': `🎬 *New Project Assigned*\n\nYou've been assigned to:\n*${projectTitle}*\n\nProject ID: ${projectId}\n\nPlease check the dashboard for details.`,

    'comment': `💬 *New Comment*\n\n${commenterName} commented on:\n*${projectTitle}*\n\nCheck the project to view and reply.`,

    'mention': `@️⃣ *You were mentioned*\n\n${commenterName} mentioned you in:\n*${projectTitle}*\n\nCheck the comment thread.`,

    'stage-change': `📊 *Stage Updated*\n\n*${projectTitle}*\nhas moved to:\n*${newStage}*\n\nReview the updated timeline.`,

    'due-date-approaching': `⏰ *Deadline Alert*\n\n*${projectTitle}*\nis due in *${daysRemaining} days*\n\nPlease prioritize completion.`,

    'task-assignment': `✅ *Daily Task Assigned*\n\nDate: ${date}\nTime: ${timeSlot}\n\nCheck your daily tasks panel.`,

    'project-blocked': `🚫 *Project Blocked*\n\n*${projectTitle}*\nhas been marked as blocked.\n\nPlease review and resolve the issue.`,

    'review-ready': `👀 *Review Needed*\n\n*${projectTitle}*\nis ready for your review.\n\nPlease check the review link.`,

    'mograph-needed': `🎨 *Motion Graphics Needed*\n\n*${projectTitle}*\nrequires motion graphics work.\n\nPlease coordinate with the team.`,
  };

  return messages[type] || `📢 *Notification*\n\n${projectTitle || 'Update available'}`;
}

/**
 * AI-powered message generation (placeholder for future AI integration)
 * @param {string} notificationType
 * @param {Object} context
 * @returns {Promise<string>} AI-generated message
 */
export async function generateAIMessage(notificationType, context) {
  // TODO: Integrate with AI service (OpenAI, Anthropic Claude, etc.)
  // For now, use template-based formatting
  return formatWhatsAppMessage(notificationType, context);
}

export default {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  formatWhatsAppMessage,
  generateAIMessage,
};
