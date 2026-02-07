import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChildStore } from '@/stores/child-store';
import { useAuthStore } from '@/stores/auth-store';

// Helper to create a chainable Supabase query mock
function createChainMock(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit', 'single'];
  methods.forEach((method) => {
    chain[method] = jest.fn(() => chain);
  });
  // The final call resolves the promise
  chain.then = jest.fn((resolve: any) => resolve(resolvedValue));
  // Make it thenable for await
  chain[Symbol.for('Symbol.toPrimitive')] = undefined;
  Object.defineProperty(chain, 'then', {
    value: (resolve: any, reject: any) => Promise.resolve(resolvedValue).then(resolve, reject),
  });
  return chain;
}

const mockFrom = (global as any).__mockSupabaseFrom as jest.Mock;

beforeEach(() => {
  useChildStore.setState({
    children: [],
    selectedChild: null,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

describe('child-store', () => {
  describe('initial state', () => {
    it('starts with empty children and no selection', () => {
      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.selectedChild).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('selectChild', () => {
    it('selects a child by id', () => {
      const children = [
        { id: 'child-1', firstName: 'Alice' },
        { id: 'child-2', firstName: 'Bob' },
      ] as any[];
      useChildStore.setState({ children });

      useChildStore.getState().selectChild('child-2');

      expect(useChildStore.getState().selectedChild).toEqual(children[1]);
    });

    it('sets null when child id not found', () => {
      const children = [{ id: 'child-1', firstName: 'Alice' }] as any[];
      useChildStore.setState({ children });

      useChildStore.getState().selectChild('nonexistent');

      expect(useChildStore.getState().selectedChild).toBeNull();
    });
  });

  describe('fetchChildren (demo mode)', () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: true });
    });

    it('loads children from AsyncStorage in demo mode', async () => {
      const storedChildren = [
        {
          id: 'demo_1',
          parentUserId: 'demo_user',
          firstName: 'Demo',
          lastName: 'Child',
          dateOfBirth: '2023-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedChildren));

      await useChildStore.getState().fetchChildren();

      const state = useChildStore.getState();
      expect(state.children).toHaveLength(1);
      expect(state.children[0].firstName).toBe('Demo');
      expect(state.children[0].dateOfBirth).toBeInstanceOf(Date);
      expect(state.isLoading).toBe(false);
    });

    it('returns empty array when no stored children in demo mode', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await useChildStore.getState().fetchChildren();

      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchChildren (authenticated mode)', () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: false });
    });

    it('loads children from Supabase', async () => {
      const chain = createChainMock({
        data: [
          {
            id: 'child-1',
            parent_user_id: 'user-1',
            first_name: 'Alice',
            last_name: 'Smith',
            date_of_birth: '2022-06-15',
            gender: 'female',
            premature_weeks: 0,
            photo_url: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValueOnce(chain);

      await useChildStore.getState().fetchChildren();

      const state = useChildStore.getState();
      expect(state.children).toHaveLength(1);
      expect(state.children[0].firstName).toBe('Alice');
      expect(state.children[0].lastName).toBe('Smith');
      expect(state.children[0].dateOfBirth).toBeInstanceOf(Date);
      expect(state.isLoading).toBe(false);
    });

    it('handles Supabase error', async () => {
      const chain = createChainMock({
        data: null,
        error: new Error('Network error'),
      });
      mockFrom.mockReturnValueOnce(chain);

      await useChildStore.getState().fetchChildren();

      const state = useChildStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('addChild (demo mode)', () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: true });
    });

    it('adds child to local storage and state', async () => {
      const result = await useChildStore.getState().addChild({
        firstName: 'New',
        lastName: 'Child',
        dateOfBirth: new Date('2023-05-01'),
        gender: 'male',
        prematureWeeks: 0,
      });

      expect(result.error).toBeNull();
      expect(result.child).not.toBeNull();
      expect(result.child!.firstName).toBe('New');
      expect(result.child!.id).toMatch(/^demo_/);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@devassess/demo_children',
        expect.any(String)
      );

      const state = useChildStore.getState();
      expect(state.children).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateChild', () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: false });
    });

    it('updates child in state after successful Supabase update', async () => {
      useChildStore.setState({
        children: [
          {
            id: 'child-1',
            firstName: 'Alice',
            lastName: 'Smith',
            updatedAt: new Date('2024-01-01'),
          } as any,
        ],
        selectedChild: {
          id: 'child-1',
          firstName: 'Alice',
          lastName: 'Smith',
          updatedAt: new Date('2024-01-01'),
        } as any,
      });

      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValueOnce(chain);

      const result = await useChildStore.getState().updateChild('child-1', {
        firstName: 'Alicia',
      });

      expect(result.error).toBeNull();
      const state = useChildStore.getState();
      expect(state.children[0].firstName).toBe('Alicia');
      expect(state.selectedChild!.firstName).toBe('Alicia');
    });
  });

  describe('deleteChild', () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: false });
    });

    it('removes child from state after successful delete', async () => {
      useChildStore.setState({
        children: [
          { id: 'child-1', firstName: 'Alice' } as any,
          { id: 'child-2', firstName: 'Bob' } as any,
        ],
        selectedChild: { id: 'child-1', firstName: 'Alice' } as any,
      });

      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValueOnce(chain);

      const result = await useChildStore.getState().deleteChild('child-1');

      expect(result.error).toBeNull();
      const state = useChildStore.getState();
      expect(state.children).toHaveLength(1);
      expect(state.children[0].id).toBe('child-2');
      expect(state.selectedChild).toBeNull(); // Was selected, now cleared
    });

    it('keeps selectedChild if a different child is deleted', async () => {
      useChildStore.setState({
        children: [
          { id: 'child-1', firstName: 'Alice' } as any,
          { id: 'child-2', firstName: 'Bob' } as any,
        ],
        selectedChild: { id: 'child-1', firstName: 'Alice' } as any,
      });

      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValueOnce(chain);

      await useChildStore.getState().deleteChild('child-2');

      const state = useChildStore.getState();
      expect(state.children).toHaveLength(1);
      expect(state.selectedChild!.id).toBe('child-1');
    });
  });
});
