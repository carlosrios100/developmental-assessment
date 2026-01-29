import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Child, Assessment } from '@devassess/shared';

interface ChildState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChildren: () => Promise<void>;
  selectChild: (childId: string) => void;
  addChild: (child: Omit<Child, 'id' | 'parentUserId' | 'createdAt' | 'updatedAt'>) => Promise<{ error: Error | null; child: Child | null }>;
  updateChild: (childId: string, updates: Partial<Child>) => Promise<{ error: Error | null }>;
  deleteChild: (childId: string) => Promise<{ error: Error | null }>;
}

export const useChildStore = create<ChildState>((set, get) => ({
  children: [],
  selectedChild: null,
  isLoading: false,
  error: null,

  fetchChildren: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const children: Child[] = (data || []).map((row) => ({
        id: row.id,
        parentUserId: row.parent_user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        dateOfBirth: new Date(row.date_of_birth),
        gender: row.gender,
        prematureWeeks: row.premature_weeks,
        photoUrl: row.photo_url,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      set({ children, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch children',
        isLoading: false,
      });
    }
  },

  selectChild: (childId: string) => {
    const child = get().children.find((c) => c.id === childId) || null;
    set({ selectedChild: child });
  },

  addChild: async (childData) => {
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('children')
        .insert({
          parent_user_id: user.id,
          first_name: childData.firstName,
          last_name: childData.lastName,
          date_of_birth: childData.dateOfBirth.toISOString().split('T')[0],
          gender: childData.gender,
          premature_weeks: childData.prematureWeeks || 0,
          photo_url: childData.photoUrl,
          notes: childData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      const newChild: Child = {
        id: data.id,
        parentUserId: data.parent_user_id,
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: new Date(data.date_of_birth),
        gender: data.gender,
        prematureWeeks: data.premature_weeks,
        photoUrl: data.photo_url,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      set((state) => ({
        children: [newChild, ...state.children],
        isLoading: false,
      }));

      return { error: null, child: newChild };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add child';
      set({ error: errorMessage, isLoading: false });
      return { error: new Error(errorMessage), child: null };
    }
  },

  updateChild: async (childId: string, updates: Partial<Child>) => {
    set({ isLoading: true, error: null });

    try {
      const updateData: Record<string, any> = {};
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.dateOfBirth) updateData.date_of_birth = updates.dateOfBirth.toISOString().split('T')[0];
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.prematureWeeks !== undefined) updateData.premature_weeks = updates.prematureWeeks;
      if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('children')
        .update(updateData)
        .eq('id', childId);

      if (error) throw error;

      set((state) => ({
        children: state.children.map((c) =>
          c.id === childId ? { ...c, ...updates, updatedAt: new Date() } : c
        ),
        selectedChild:
          state.selectedChild?.id === childId
            ? { ...state.selectedChild, ...updates, updatedAt: new Date() }
            : state.selectedChild,
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update child';
      set({ error: errorMessage, isLoading: false });
      return { error: new Error(errorMessage) };
    }
  },

  deleteChild: async (childId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.from('children').delete().eq('id', childId);

      if (error) throw error;

      set((state) => ({
        children: state.children.filter((c) => c.id !== childId),
        selectedChild: state.selectedChild?.id === childId ? null : state.selectedChild,
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete child';
      set({ error: errorMessage, isLoading: false });
      return { error: new Error(errorMessage) };
    }
  },
}));
