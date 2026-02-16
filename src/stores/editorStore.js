import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  // Current state
  currentPage: null,
  blocks: {},
  blockOrder: [],
  isDirty: false,
  isSaving: false,
  lastSaved: null,

  // Actions
  setCurrentPage: (page) => set({
    currentPage: page,
    blocks: page?.blocks?.reduce((acc, block) => {
      acc[block.id] = block;
      return acc;
    }, {}) || {},
    blockOrder: page?.blockOrder || [],
    isDirty: false
  }),

  updateBlock: (blockId, updates) => set((state) => ({
    blocks: {
      ...state.blocks,
      [blockId]: {
        ...state.blocks[blockId],
        ...updates,
        updatedAt: Date.now()
      }
    },
    isDirty: true
  })),

  addBlock: (block, afterBlockId = null) => set((state) => {
    const newBlocks = { ...state.blocks, [block.id]: block };
    let newBlockOrder = [...state.blockOrder];

    if (afterBlockId) {
      const index = newBlockOrder.indexOf(afterBlockId);
      newBlockOrder.splice(index + 1, 0, block.id);
    } else {
      newBlockOrder.push(block.id);
    }

    return {
      blocks: newBlocks,
      blockOrder: newBlockOrder,
      isDirty: true
    };
  }),

  deleteBlock: (blockId) => set((state) => {
    const newBlocks = { ...state.blocks };
    delete newBlocks[blockId];

    return {
      blocks: newBlocks,
      blockOrder: state.blockOrder.filter(id => id !== blockId),
      isDirty: true
    };
  }),

  reorderBlocks: (newOrder) => set({
    blockOrder: newOrder,
    isDirty: true
  }),

  setSaving: (isSaving) => set({ isSaving }),

  markSaved: () => set({
    isDirty: false,
    lastSaved: Date.now()
  }),

  resetDirty: () => set({ isDirty: false }),

  clearEditor: () => set({
    currentPage: null,
    blocks: {},
    blockOrder: [],
    isDirty: false,
    isSaving: false
  }),

  // Getters
  getBlock: (blockId) => get().blocks[blockId],
  getAllBlocks: () => get().blockOrder.map(id => get().blocks[id]).filter(Boolean),
  hasUnsavedChanges: () => get().isDirty
}));
