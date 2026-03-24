import connectDB from '@/lib/mongodb';
import InstaAutomation from '@/models/InstaAutomation';

function buildCompiledReplyMessage(replyMessage, productLink) {
  if (!productLink) return replyMessage;
  return `${replyMessage}\n\n${productLink}`.trim();
}

function toAutomationRecord(accountId, createdBy, payload) {
  const replyMessage = payload.replyMessage?.trim() || '';
  const productLink = payload.productLink?.trim() || '';

  return {
    accountId,
    createdBy,
    triggerType: 'comment',
    triggerKeyword: payload.triggerKeyword?.trim() || '',
    matchType: payload.matchType || 'contains',
    replyType: payload.replyType || 'both',
    replyMessage,
    productLink,
    compiledReplyMessage: buildCompiledReplyMessage(replyMessage, productLink),
    targetMediaId: payload.targetMediaId || 'any',
    targetMediaCaption: payload.targetMediaCaption || '',
    targetMediaUrl: payload.targetMediaUrl || '',
    targetMediaType: payload.targetMediaType || '',
    active: payload.active !== false,
  };
}

export const InstaAutomationService = {
  async getAutomations(accountId) {
    await connectDB();
    return InstaAutomation.find({ accountId }).lean().then(docs =>
      docs.map(d => ({ ...d, id: d._id.toString() }))
    );
  },

  async getAutomationForMedia(accountId, mediaId) {
    await connectDB();
    if (!mediaId) return null;
    const doc = await InstaAutomation.findOne({ accountId, targetMediaId: mediaId }).lean();
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async createAutomation(accountId, createdBy, payload) {
    await connectDB();
    if (!payload.targetMediaId) throw new Error('targetMediaId is required');
    if (!payload.triggerKeyword?.trim()) throw new Error('triggerKeyword is required');

    // Check if automation already exists for this media
    const existing = await InstaAutomation.findOne({ accountId, targetMediaId: payload.targetMediaId }).lean();
    if (existing) {
      const error = new Error('Automation already exists for this media');
      error.code = 'AUTOMATION_EXISTS';
      error.automation = { ...existing, id: existing._id.toString() };
      throw error;
    }

    const doc = await InstaAutomation.create(toAutomationRecord(accountId, createdBy, payload));
    const obj = doc.toObject();
    return { ...obj, id: obj._id.toString() };
  },

  async updateAutomation(accountId, automationId, payload) {
    await connectDB();
    const existing = await InstaAutomation.findById(automationId).lean();
    if (!existing || existing.accountId !== accountId) return null;

    const updates = toAutomationRecord(accountId, existing.createdBy, {
      ...existing,
      ...payload,
      targetMediaId: existing.targetMediaId,
    });

    const doc = await InstaAutomation.findByIdAndUpdate(automationId, updates, { new: true }).lean();
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async toggleAutomation(accountId, automationId) {
    await connectDB();
    const existing = await InstaAutomation.findById(automationId).lean();
    if (!existing || existing.accountId !== accountId) return null;
    const doc = await InstaAutomation.findByIdAndUpdate(automationId, { active: !existing.active }, { new: true }).lean();
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async deleteAutomation(accountId, automationId) {
    await connectDB();
    const existing = await InstaAutomation.findById(automationId).lean();
    if (!existing || existing.accountId !== accountId) return null;
    const doc = await InstaAutomation.findByIdAndDelete(automationId).lean();
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },
};
