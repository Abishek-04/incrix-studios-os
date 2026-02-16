import { create } from 'zustand';

export const useWorkspaceStore = create((set, get) => ({
  // State
  pages: [],
  currentWorkspace: null,
  searchResults: [],
  isLoading: false,
  error: null,

  // Actions
  setPages: (pages) => set({ pages, isLoading: false }),

  addPage: (page) => set((state) => ({
    pages: [...state.pages, page]
  })),

  updatePage: (pageId, updates) => set((state) => ({
    pages: state.pages.map(p =>
      p.id === pageId ? { ...p, ...updates, updatedAt: Date.now() } : p
    )
  })),

  deletePage: (pageId) => set((state) => ({
    pages: state.pages.filter(p => p.id !== pageId)
  })),

  setSearchResults: (results) => set({ searchResults: results }),

  clearSearch: () => set({ searchResults: [] }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearError: () => set({ error: null }),

  // Fetch pages from API
  fetchPages: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/pages?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        set({ pages: data.pages, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create new page
  createPage: async (pageData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      });

      const data = await response.json();

      if (data.success) {
        set((state) => ({
          pages: [...state.pages, data.page],
          isLoading: false
        }));
        return data.page;
      } else {
        set({ error: data.error, isLoading: false });
        return null;
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // Getters
  getPageById: (pageId) => get().pages.find(p => p.id === pageId),
  getPagesByType: (type) => get().pages.filter(p => p.type === type && !p.archived),
  getArchivedPages: () => get().pages.filter(p => p.archived),
  getRecentPages: (limit = 10) => get().pages
    .filter(p => !p.archived)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}));
