import connectDB from '@/lib/mongodb';
import InstaAutomation from '@/models/InstaAutomation';

function buildCompiledReplyMessage(replyMessage, productLink) {
  if (!productLink) return replyMessage;
  return `${replyMessage}\n\n${productLink}`.trim();
}

function toAutomationRecord(accountId, createdBy, payload) {
  const commentReplyMessage = payload.commentReplyMessage?.trim() || '';
  const dmReplyMessage = payload.dmReplyMessage?.trim() || '';
  const replyMessage = payload.replyMessage?.trim() || commentReplyMessage || dmReplyMessage;
  const productLink = payload.productLink?.trim() || '';

  return {
    accountId,
    createdBy,
    triggerType: 'comment',
    triggerKeyword: payload.triggerKeyword?.trim() || '',
    matchType: payload.matchType || 'contains',
    replyType: payload.replyType || 'both',
    replyMessage,
    commentReplyMessage,
    dmReplyMessage,
    productLink,
    productImageUrl: payload.productImageUrl?.trim() || '',
    buttonText: payload.buttonText?.trim() || 'Check Now',
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

  async getById(accountId, automationId) {
    await connectDB();
    if (!automationId) return null;
    const doc = await InstaAutomation.findById(automationId).lean();
    if (!doc || doc.accountId !== accountId) return null;
    return { ...doc, id: doc._id.toString() };
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

    // Check for duplicate keywords on the same media
    const newKeywords = payload.triggerKeyword.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const existingAutomations = await InstaAutomation.find({
      accountId,
      targetMediaId: payload.targetMediaId,
    }).lean();
    for (const existing of existingAutomations) {
      const existingKeywords = existing.triggerKeyword.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const overlap = newKeywords.filter(k => existingKeywords.includes(k));
      if (overlap.length > 0) {
        const error = new Error(`Keyword "${overlap[0]}" already exists on this media`);
        error.code = 'AUTOMATION_EXISTS';
        error.automation = { ...existing, id: existing._id.toString() };
        throw error;
      }
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
    // Read current state then flip — simple and reliable
    const current = await InstaAutomation.findOne({ _id: automationId, accountId }).select('active').lean();
    if (!current) return null;
    const doc = await InstaAutomation.findOneAndUpdate(
      { _id: automationId, accountId },
      { $set: { active: !current.active } },
      { new: true }
    ).lean();
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
