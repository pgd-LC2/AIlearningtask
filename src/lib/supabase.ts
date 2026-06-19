// localStorage-backed mock — no Supabase server required

// ─── storage helpers ──────────────────────────────────────────────────────────

const DB = 'mock_db_';
const AUTH_KEY = 'mock_auth_session';
const USERS_KEY = 'mock_auth_users';

function getTable(name: string): Record<string, unknown>[] {
  try { return JSON.parse(localStorage.getItem(DB + name) || '[]'); }
  catch { return []; }
}

function setTable(name: string, rows: Record<string, unknown>[]): void {
  localStorage.setItem(DB + name, JSON.stringify(rows));
}

function getUsers(): Record<string, Record<string, unknown>> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  catch { return {}; }
}

function setUsers(u: Record<string, Record<string, unknown>>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function getCurrentSession(): Record<string, unknown> | null {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch { return null; }
}

function setCurrentSession(s: Record<string, unknown> | null): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(s));
}

// ─── auth event bus ───────────────────────────────────────────────────────────

type AuthCb = (event: string, session: unknown) => void;
const authListeners: AuthCb[] = [];

function notifyAuth(event: string, session: unknown): void {
  authListeners.forEach(cb => cb(event, session));
}

// ─── realtime channels ────────────────────────────────────────────────────────

const channelHandlers: Record<string, Array<(payload: unknown) => void>> = {};

function createChannel(name: string) {
  const handlers: Array<(payload: unknown) => void> = [];
  channelHandlers[name] = handlers;

  const ch = {
    on(_type: string, _filter: unknown, handler: (payload: unknown) => void) {
      handlers.push(handler);
      return ch;
    },
    subscribe(cb?: (status: string) => void) {
      cb?.('SUBSCRIBED');
      return ch;
    },
    async send(msg: { payload: unknown }) {
      // local echo: same-tab broadcast
      handlers.forEach(h => h(msg.payload));
      return 'ok';
    },
    unsubscribe() {
      delete channelHandlers[name];
    },
  };
  return ch;
}

// ─── query builder ────────────────────────────────────────────────────────────

type Filter = { field: string; op: 'eq' | 'neq' | 'in'; value: unknown };

class QueryBuilder {
  private _table: string;
  private _op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private _filters: Filter[] = [];
  private _order: { field: string; asc: boolean } | null = null;
  private _mode: 'many' | 'single' | 'maybe' = 'many';
  private _insertPayload: unknown;
  private _updatePayload: Record<string, unknown> = {};

  constructor(table: string) { this._table = table; }

  select(_fields = '*') { this._op = 'select'; return this; }
  eq(field: string, value: unknown) { this._filters.push({ field, op: 'eq', value }); return this; }
  neq(field: string, value: unknown) { this._filters.push({ field, op: 'neq', value }); return this; }
  in(field: string, values: unknown[]) { this._filters.push({ field, op: 'in', value: values }); return this; }
  order(field: string, opts: { ascending?: boolean } = {}) {
    this._order = { field, asc: opts.ascending !== false };
    return this;
  }
  limit(_n: number) { return this; }
  single() { this._mode = 'single'; return this; }
  maybeSingle() { this._mode = 'maybe'; return this; }
  insert(payload: unknown) { this._op = 'insert'; this._insertPayload = payload; return this; }
  update(payload: Record<string, unknown>) { this._op = 'update'; this._updatePayload = payload; return this; }
  delete() { this._op = 'delete'; return this; }

  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return this._run().then(resolve, reject);
  }
  catch(reject: (e: unknown) => unknown) { return this._run().catch(reject); }

  private _match(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.filter(row =>
      this._filters.every(f => {
        if (f.op === 'eq') return row[f.field] === f.value;
        if (f.op === 'neq') return row[f.field] !== f.value;
        if (f.op === 'in') return (f.value as unknown[]).includes(row[f.field]);
        return true;
      })
    );
  }

  private async _run(): Promise<{ data: unknown; error: unknown }> {
    try {
      const rows = getTable(this._table);

      if (this._op === 'select') {
        let result = this._match(rows);
        if (this._order) {
          const { field, asc } = this._order;
          result = [...result].sort((a, b) => {
            const av = a[field] as string, bv = b[field] as string;
            if (av < bv) return asc ? -1 : 1;
            if (av > bv) return asc ? 1 : -1;
            return 0;
          });
        }
        if (this._mode === 'single') {
          return result.length ? { data: result[0], error: null }
            : { data: null, error: { message: 'No rows found' } };
        }
        if (this._mode === 'maybe') return { data: result[0] ?? null, error: null };
        return { data: result, error: null };
      }

      if (this._op === 'insert') {
        const now = new Date().toISOString();
        const payloads = Array.isArray(this._insertPayload)
          ? this._insertPayload as Record<string, unknown>[]
          : [this._insertPayload as Record<string, unknown>];
        const inserted = payloads.map(p => ({
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
          ...p,
        }));
        setTable(this._table, [...rows, ...inserted]);
        return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
      }

      if (this._op === 'update') {
        const now = new Date().toISOString();
        const updated = rows.map(row =>
          this._match([row]).length
            ? { ...row, ...this._updatePayload, updated_at: now }
            : row
        );
        setTable(this._table, updated);
        return { data: null, error: null };
      }

      if (this._op === 'delete') {
        setTable(this._table, rows.filter(row => !this._match([row]).length));
        return { data: null, error: null };
      }

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }
}

// ─── storage ──────────────────────────────────────────────────────────────────

const mockStorage = {
  from(bucket: string) {
    return {
      upload(path: string, file: File | Blob): Promise<{ error: unknown }> {
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            localStorage.setItem(`mock_storage_${bucket}/${path}`, reader.result as string);
            resolve({ error: null });
          };
          reader.onerror = () => resolve({ error: { message: 'Upload failed' } });
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl(path: string): { data: { publicUrl: string } } {
        const stored = localStorage.getItem(`mock_storage_${bucket}/${path}`);
        return { data: { publicUrl: stored || '' } };
      },
    };
  },
};

// ─── user profile helper ──────────────────────────────────────────────────────

function ensureProfile(userId: string): void {
  const profiles = getTable('user_profiles');
  if (!profiles.find(p => p.id === userId)) {
    setTable('user_profiles', [
      ...profiles,
      {
        id: userId,
        is_activated: true,
        is_admin: true,
        activation_code_id: null,
        activated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
  }
}

// ─── auth ─────────────────────────────────────────────────────────────────────

function makeSession(user: Record<string, unknown>) {
  return { access_token: `mock-${user.id}`, user, expires_at: Date.now() + 86400000 };
}

const mockAuth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const users = getUsers();
    const user = Object.values(users).find(u => u.email === email && u.password === password);
    if (!user) return { data: { user: null, session: null }, error: { message: '邮箱或密码错误' } };
    const session = makeSession(user);
    setCurrentSession(session);
    ensureProfile(user.id as string);
    notifyAuth('SIGNED_IN', session);
    return { data: { user, session }, error: null };
  },

  async signUp({ email, password }: { email: string; password?: string; options?: unknown }) {
    const users = getUsers();
    if (Object.values(users).find(u => u.email === email)) {
      return { data: { user: null, session: null }, error: { message: '该邮箱已被注册' } };
    }
    const user: Record<string, unknown> = {
      id: crypto.randomUUID(),
      email,
      password: password || '',
      created_at: new Date().toISOString(),
    };
    users[user.id as string] = user;
    setUsers(users);
    const session = makeSession(user);
    setCurrentSession(session);
    ensureProfile(user.id as string);
    notifyAuth('SIGNED_IN', session);
    return { data: { user, session }, error: null };
  },

  async signOut() {
    setCurrentSession(null);
    notifyAuth('SIGNED_OUT', null);
    return { error: null };
  },

  async getSession() {
    return { data: { session: getCurrentSession() }, error: null };
  },

  onAuthStateChange(callback: AuthCb) {
    authListeners.push(callback);
    const session = getCurrentSession();
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe() {
            const i = authListeners.indexOf(callback);
            if (i !== -1) authListeners.splice(i, 1);
          },
        },
      },
    };
  },
};

// ─── RPC ──────────────────────────────────────────────────────────────────────

async function mockRpc(fn: string, params?: Record<string, unknown>) {
  if (fn === 'verify_and_use_activation_code') {
    const session = getCurrentSession();
    if (!session) return { data: false, error: null };
    const userId = (session.user as Record<string, unknown>).id as string;
    const codes = getTable('activation_codes');
    const code = codes.find(c => c.code === params?.activation_code && !c.used);
    if (!code) return { data: false, error: null };
    setTable('activation_codes', codes.map(c =>
      c.id === code.id ? { ...c, used: true, used_by: userId, used_at: new Date().toISOString() } : c
    ));
    setTable('user_profiles', getTable('user_profiles').map(p =>
      p.id === userId ? { ...p, is_activated: true, activation_code_id: code.id, activated_at: new Date().toISOString() } : p
    ));
    return { data: true, error: null };
  }
  return { data: null, error: { message: `RPC ${fn} not implemented` } };
}

// ─── export ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = {
  auth: mockAuth,
  from: (table: string) => new QueryBuilder(table),
  storage: mockStorage,
  rpc: mockRpc,
  channel: createChannel,
  removeChannel: (_ch: unknown) => Promise.resolve(),
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
