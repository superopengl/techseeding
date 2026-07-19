import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tree,
  Typography,
  message
} from 'antd';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  MinusSquareOutlined,
  MoreOutlined,
  PlusSquareOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import MDEditor from '@uiw/react-md-editor/nohighlight';
import Logo from '../components/Logo.jsx';
import SplitDiff from '../components/SplitDiff.jsx';
import apiFetch from '../lib/apiFetch.js';
import authSession from '../lib/authSession.js';
import { palette, radius } from '../theme.js';

const { Paragraph, Text } = Typography;
const MIN_PASSWORD_LENGTH = 8;

const YEARS = ['Y3', 'Y4', 'Y5', 'Y6'];
const SUBJECTS = [
  { key: 'math', label: 'Math' },
  { key: 'thinking', label: 'Thinking' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' }
];

// Sentinel key the single global row stores itself under (mirrors the API).
const GLOBAL_KEY = 'global';

// Parse a prompt-tree node key into the row it edits plus the subject/year
// path that led to it. Node keys: 'global' | 'subject:<s>' | 'year:<s>:<y>'.
// Year nodes carry their parent subject only to keep tree keys unique — the
// row they edit is the subject-independent (year, <y>) prompt.
function parsePromptNode(key) {
  const [head, a, b] = String(key).split(':');
  if (head === 'subject') return { scope: 'subject', scopeKey: a, subject: a, year: null };
  if (head === 'year') return { scope: 'year', scopeKey: b, subject: a, year: b };
  return { scope: 'global', scopeKey: GLOBAL_KEY, subject: null, year: null };
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleColor(role) {
  if (role === 'admin') return 'magenta';
  if (role === 'teacher') return 'geekblue';
  if (role === 'parent') return 'gold';
  return 'green';
}

function TokenUsageModal({ target, onClose }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [splitBy, setSplitBy] = useState('purpose');
  const [metric, setMetric] = useState('totalTokens');

  useEffect(() => {
    if (!target) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDays([]);
    (async () => {
      try {
        const res = await apiFetch(`/api/admin/user/${target.id}/token-usage`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        if (!cancelled) setDays(json.days || []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load token usage');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  // Aggregate the (date, purpose, model) rows from the API into the shape
  // AntD Plots wants: one row per (date, splitDimension) with `value` for
  // the currently-selected metric. Total / cost summary stays the same
  // regardless of split.
  const { chartData, summary } = useMemo(() => {
    const totals = { totalTokens: 0, costUsd: 0, calls: 0 };
    const bucket = new Map();
    for (const d of days) {
      const groupKey = splitBy === 'model' ? d.model || '(unknown)' : d.purpose || '(unknown)';
      const key = `${d.date}|${groupKey}`;
      const prior = bucket.get(key) || { date: d.date, group: groupKey, value: 0 };
      const raw = metric === 'costUsd' ? Number(d.costUsd) || 0 : d[metric] || 0;
      prior.value += raw;
      bucket.set(key, prior);
      totals.totalTokens += d.totalTokens || 0;
      totals.costUsd += Number(d.costUsd) || 0;
      totals.calls += d.calls || 0;
    }
    return { chartData: Array.from(bucket.values()), summary: totals };
  }, [days, splitBy, metric]);

  const open = Boolean(target);
  const isCost = metric === 'costUsd';

  return (
    <Modal
      open={open}
      title={target ? `Token usage · ${target.name || '—'}` : 'Token usage'}
      centered
      width={920}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total tokens"
              value={summary.totalTokens}
              formatter={(v) => Number(v).toLocaleString()}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total cost (USD)"
              value={summary.costUsd}
              precision={4}
              prefix="$"
            />
          </Col>
          <Col span={8}>
            <Statistic title="Upstream calls" value={summary.calls} />
          </Col>
        </Row>

        <Space wrap size={12}>
          <span style={{ color: palette.textMuted, fontSize: 13 }}>Split by</span>
          <Segmented
            value={splitBy}
            onChange={setSplitBy}
            options={[
              { label: 'Purpose', value: 'purpose' },
              { label: 'Model', value: 'model' }
            ]}
          />
          <span style={{ color: palette.textMuted, fontSize: 13, marginLeft: 12 }}>Metric</span>
          <Segmented
            value={metric}
            onChange={setMetric}
            options={[
              { label: 'Total tokens', value: 'totalTokens' },
              { label: 'Input', value: 'inputTokens' },
              { label: 'Output', value: 'outputTokens' },
              { label: 'Cost (USD)', value: 'costUsd' }
            ]}
          />
        </Space>

        {error && <Alert type="error" showIcon message={error} />}

        <div style={{ minHeight: 340 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <Spin />
            </div>
          ) : chartData.length === 0 ? (
            <Empty description="No token usage on record for this user yet." style={{ padding: 40 }} />
          ) : (
            <Column
              data={chartData}
              xField="date"
              yField="value"
              colorField="group"
              stack
              height={340}
              axis={{
                y: {
                  labelFormatter: (v) =>
                    isCost ? `$${Number(v).toFixed(2)}` : Number(v).toLocaleString()
                }
              }}
              tooltip={{
                title: 'date',
                items: [
                  {
                    name: 'group',
                    field: 'value',
                    valueFormatter: (v) =>
                      isCost ? `$${Number(v).toFixed(4)}` : Number(v).toLocaleString()
                  }
                ]
              }}
              legend={{ color: { position: 'top' } }}
            />
          )}
        </div>
      </Space>
    </Modal>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenUsageTarget, setTokenUsageTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/users');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setUsers(json.users || []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearData = useCallback(
    (row) => {
      Modal.confirm({
        title: `Clear all data for ${row.name || 'this student'}?`,
        content: (
          <div>
            <p style={{ marginTop: 0 }}>
              Every tutoring session, image, message, OCR/vision row, and analysis
              report tied to this student will be permanently deleted. The student's
              account will stay so they can sign back in to a fresh slate.
            </p>
            <p style={{ marginBottom: 0, color: palette.textMuted }}>
              This cannot be undone.
            </p>
          </div>
        ),
        okText: 'Clear data',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        centered: true,
        async onOk() {
          try {
            const res = await apiFetch(`/api/admin/user/${row.id}/data`, {
              method: 'DELETE'
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
            const { sessions = 0, images = 0, subjectReports = 0 } = json.deleted || {};
            message.success(
              `Cleared data: ${sessions} session(s), ${images} image(s), ${subjectReports} report(s).`
            );
            load();
          } catch (e) {
            message.error(e.message || 'Failed to clear data');
            throw e;
          }
        }
      });
    },
    [load]
  );

  const columns = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        render: (_, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              src={row.picture || undefined}
              size={36}
              style={{
                background: row.picture ? 'transparent' : palette.tint.primary,
                color: palette.primary,
                fontWeight: 700
              }}
            >
              {!row.picture && initialsOf(row.name)}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: palette.text, fontWeight: 600 }}>
                {row.name || '—'}
              </span>
            </div>
          </div>
        )
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
        render: (email) => (
          <span style={{ color: email ? palette.text : palette.textMuted }}>
            {email || '—'}
          </span>
        )
      },
      {
        title: 'Created at',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 220,
        sorter: (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        defaultSortOrder: 'descend',
        render: (iso) => (
          <span style={{ color: palette.textMuted }}>{formatDateTime(iso)}</span>
        )
      },
      {
        title: 'Last activity',
        dataIndex: 'lastActivityAt',
        key: 'lastActivityAt',
        width: 220,
        // Nulls (users who never tutored) sort to the bottom of a descending
        // sort — treat a missing timestamp as epoch 0.
        sorter: (a, b) =>
          (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0) -
          (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0),
        render: (iso) => (
          <span style={{ color: iso ? palette.text : palette.textMuted }}>
            {iso ? formatDateTime(iso) : 'No activity yet'}
          </span>
        )
      },
      {
        title: '',
        key: 'actions',
        width: 56,
        align: 'center',
        render: (_, row) => {
          // Token usage is available for every role — the chart reads from
          // llm_usage, which can carry rows for any user. Clear data is
          // student-only because the backend's 409 guard restricts the
          // wipe to role='student' accounts.
          const isStudent = row.role === 'student';
          const items = [
            {
              key: 'token-usage',
              icon: <BarChartOutlined />,
              label: 'Token usage'
            },
            { type: 'divider' },
            {
              key: 'clear-data',
              danger: true,
              disabled: !isStudent,
              icon: <DeleteOutlined />,
              label: 'Clear data',
            }
          ];
          return (
            <Dropdown
              trigger={['click']}
              menu={{
                items,
                onClick: ({ key }) => {
                  if (key === 'token-usage') setTokenUsageTarget(row);
                  if (key === 'clear-data' && isStudent) handleClearData(row);
                }
              }}
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          );
        }
      }
    ],
    [handleClearData]
  );

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={load}>
              Retry
            </Button>
          }
        />
      )}
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={users}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      <TokenUsageModal
        target={tokenUsageTarget}
        onClose={() => setTokenUsageTarget(null)}
      />
    </div>
  );
}

// Live autosave indicator that replaces the old Save/Revert buttons. It
// mirrors the debounce lifecycle: pending edit → in-flight PUT → settled.
function SaveStatus({ saving, dirty, empty }) {
  if (saving) {
    return (
      <Space size={6} align="center">
        <Spin size="small" />
        <Text style={{ color: palette.textMuted, fontSize: 12 }}>Saving…</Text>
      </Space>
    );
  }
  if (empty) {
    return (
      <Text type="warning" style={{ fontSize: 12 }}>
        Prompt is empty — nothing saved
      </Text>
    );
  }
  if (dirty) {
    return (
      <Text style={{ color: palette.textMuted, fontSize: 12 }}>Unsaved changes…</Text>
    );
  }
  return (
    <Space size={6} align="center">
      <CheckCircleOutlined style={{ color: palette.success, fontSize: 13 }} />
      <Text style={{ color: palette.textMuted, fontSize: 12 }}>All changes saved</Text>
    </Space>
  );
}

// Editor for the three-tier system-prompt stack composed on every tutor
// turn: GLOBAL (agent role + product scope), SUBJECT (content scope, tone,
// notation), and YEAR (knowledge boundary + constraints). The final prompt
// is global + subject + year. The backend seeds all 9 rows on boot, so every
// tier is present to fetch and update.
//
// Layout is three columns: a tree on the left (Global → Subject → Year) picks
// the edit target, the middle column edits that node's prompt, and the right
// column previews the composite along the selected path. Edits autosave and
// take effect on the very next tutor turn.
//
// The editor/preview panes grow to fill the viewport: we measure the row's
// top edge and size them to the remaining screen height (down to a floor).
const MIN_EDITOR_HEIGHT = 360;
const COL_HEADER_H = 44; // label + hint block above each pane
const EDITOR_FOOTER_H = 34; // "last saved" + save-status row under the editor
const TAB_BAR_H = 46; // AntD tab bar above the editor / diff panes
const VIEWPORT_BOTTOM_GAP = 16; // breathing room below the panes

function AgentPromptsPanel() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // The selected tree node — 'global' | 'subject:<s>' | 'year:<s>:<y>'.
  const [selectedKey, setSelectedKey] = useState('global');
  const [activeEditorTab, setActiveEditorTab] = useState('editor');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  // Published, AI-refined composites (one per subject × year) + publish state.
  const [composites, setComposites] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(null); // { done, total }

  // Grow the panes to fill the screen: measure the row's top and use the
  // remaining viewport height. Recomputed on resize and once data lands.
  const rowRef = useRef(null);
  const [areaHeight, setAreaHeight] = useState(560);
  useLayoutEffect(() => {
    function measure() {
      const el = rowRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setAreaHeight(
        Math.max(MIN_EDITOR_HEIGHT, Math.floor(window.innerHeight - top - VIEWPORT_BOTTOM_GAP))
      );
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersRes, compRes] = await Promise.all([
        apiFetch('/api/admin/agent-prompts'),
        apiFetch('/api/admin/composite-prompts')
      ]);
      const tiersJson = await tiersRes.json().catch(() => ({}));
      if (!tiersRes.ok) throw new Error(tiersJson.error || `Request failed (${tiersRes.status})`);
      setPrompts(tiersJson.prompts || []);
      const compJson = await compRes.json().catch(() => ({}));
      if (compRes.ok) setComposites(compJson.prompts || []);
    } catch (e) {
      setError(e.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The row the selected node edits, plus the subject/year path to it.
  const sel = useMemo(() => parsePromptNode(selectedKey), [selectedKey]);
  const { scope: activeScope, scopeKey: activeKey } = sel;

  // The immutable published versions of a tier, newest first (version != null).
  const tierVersionsFor = useCallback(
    (scope, key) =>
      prompts
        .filter((p) => p.scope === scope && p.scopeKey === key && p.version != null)
        .sort((a, b) => b.version - a.version),
    [prompts]
  );
  // The mutable draft row (version IS null) — what the editor edits.
  const rowFor = useCallback(
    (scope, key) =>
      prompts.find((p) => p.scope === scope && p.scopeKey === key && p.version == null) ||
      null,
    [prompts]
  );

  const currentRow = useMemo(
    () => rowFor(activeScope, activeKey),
    [rowFor, activeScope, activeKey]
  );

  // Reset the draft to the DB copy whenever the selection changes or fresh
  // data lands. Anything typed but unsaved is dropped on that switch — form
  // state is scoped to a single row selection.
  useEffect(() => {
    setDraft(currentRow?.content ?? '');
  }, [currentRow]);

  const dirty = currentRow != null && draft !== currentRow.content;

  // Save the mutable draft row in place (version stays null). Called by the
  // realtime autosave below — never creates a version; those come from Publish.
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/agent-prompt/${activeScope}/${activeKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const saved = json.prompt;
      setPrompts((prev) => {
        const isSameDraft = (p) =>
          p.scope === saved.scope && p.scopeKey === saved.scopeKey && p.version == null;
        return prev.some(isSameDraft)
          ? prev.map((p) => (isSameDraft(p) ? saved : p))
          : [...prev, saved];
      });
    } catch (e) {
      message.error(e.message || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }, [draft, activeScope, activeKey]);

  // Realtime autosave: the draft row is mutable, so it writes through ~800ms
  // after the admin stops typing, coalescing keystrokes into one PUT.
  // Switching nodes resets `draft` (dirty → false) and the cleanup clears any
  // pending timer, so a half-typed edit never lands on the wrong tier.
  useEffect(() => {
    if (!dirty || !draft.trim()) return undefined;
    const handle = setTimeout(save, 800);
    return () => clearTimeout(handle);
  }, [dirty, draft, save]);

  // Effective content for a tier — the live draft when it's the row being
  // edited, otherwise the last-known DB copy. Lets the composite preview
  // reflect unsaved edits to the open node.
  const contentFor = useCallback(
    (scope, key) => {
      if (scope === activeScope && key === activeKey) return draft;
      return rowFor(scope, key)?.content ?? '';
    },
    [activeScope, activeKey, draft, rowFor]
  );

  // Composite = the prompts along the path from root to the selected node:
  // global alone, global + subject, or global + subject + year.
  const composite = useMemo(() => {
    const parts = [contentFor('global', GLOBAL_KEY)];
    if (sel.subject) parts.push(contentFor('subject', sel.subject));
    if (sel.year) parts.push(contentFor('year', sel.year));
    return parts
      .map((c) => c.trim())
      .filter(Boolean)
      .join('\n\n');
  }, [contentFor, sel.subject, sel.year]);

  // A tier has unpublished changes when its draft (live for the open node)
  // differs from its latest published version — or it's never been published
  // but has content. Drives the red dot on the tree.
  const tierHasUnpublishedChanges = useCallback(
    (scope, key) => {
      const latest = tierVersionsFor(scope, key)[0] || null;
      const draftContent = contentFor(scope, key);
      if (!latest) return draftContent.trim().length > 0;
      return draftContent !== latest.content;
    },
    [tierVersionsFor, contentFor]
  );

  const treeData = useMemo(() => {
    const nodeTitle = (label, scope, key) =>
      tierHasUnpublishedChanges(scope, key) ? (
        <span>
          {label}
          <span
            title="Unpublished draft"
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: palette.danger ?? '#ff4d4f',
              marginLeft: 6,
              verticalAlign: 'middle'
            }}
          />
        </span>
      ) : (
        label
      );
    return [
      {
        title: nodeTitle('Global', 'global', GLOBAL_KEY),
        key: 'global',
        children: SUBJECTS.map((s) => ({
          title: nodeTitle(s.label, 'subject', s.key),
          key: `subject:${s.key}`,
          children: YEARS.map((y) => ({
            title: nodeTitle(y, 'year', y),
            key: `year:${s.key}:${y}`,
            isLeaf: true
          }))
        }))
      }
    ];
  }, [tierHasUnpublishedChanges]);

  const subjectLabel = (key) => SUBJECTS.find((s) => s.key === key)?.label ?? key;

  // Human labels for the edit target and the composite path.
  const targetLabel =
    activeScope === 'global'
      ? 'Global prompt'
      : activeScope === 'subject'
        ? `Subject · ${subjectLabel(sel.subject)}`
        : `Year · ${sel.year}`;
  const targetHint =
    activeScope === 'global'
      ? 'Applies to every turn — the agent role and product scope.'
      : activeScope === 'subject'
        ? 'Subject content, teaching tone, and any special format or symbol conventions.'
        : 'Knowledge area / boundary for this year, shared across all subjects.';
  const pathLabel = ['global', sel.subject && subjectLabel(sel.subject), sel.year]
    .filter(Boolean)
    .join(' + ');

  // All immutable versions for a (subject, year), newest first.
  const versionsFor = useCallback(
    (s, y) =>
      composites
        .filter((c) => c.subject === s && c.year === y)
        .sort((a, b) => b.version - a.version),
    [composites]
  );
  // The latest published version (what tutor turns use).
  const publishedFor = useCallback((s, y) => versionsFor(s, y)[0] || null, [versionsFor]);

  // A published composite is stale when any of its three source tiers was
  // edited after the last refinement — the admin should re-publish.
  const isStale = useCallback(
    (s, y) => {
      const pub = publishedFor(s, y);
      if (!pub?.refinedAt) return false;
      const refined = new Date(pub.refinedAt).getTime();
      return [
        rowFor('global', GLOBAL_KEY)?.updatedAt,
        rowFor('subject', s)?.updatedAt,
        rowFor('year', y)?.updatedAt
      ].some((t) => t && new Date(t).getTime() > refined);
    },
    [publishedFor, rowFor]
  );

  // What Publish acts on, derived from the selected node: a year leaf → that
  // one (subject, year); a subject → all its years; global → all 16 combos.
  const publishTargets = useMemo(() => {
    const subjects = sel.subject ? [sel.subject] : SUBJECTS.map((s) => s.key);
    const years = sel.year ? [sel.year] : YEARS;
    return subjects.flatMap((s) => years.map((y) => ({ subject: s, year: y })));
  }, [sel.subject, sel.year]);

  const doPublish = useCallback(async () => {
    const targets = publishTargets;
    const total = targets.length;
    const key = 'composite-publish';
    setPublishing(true);
    setPublishProgress({ done: 0, total });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < total; i += 1) {
      const t = targets[i];
      const label = `${SUBJECTS.find((s) => s.key === t.subject)?.label ?? t.subject} · ${t.year}`;
      // One updating toast — each refinement is a ~20-30s model call, so
      // without live progress a batch reads as a hung button.
      message.open({
        key,
        type: 'loading',
        content: `Refining ${label} (${i + 1}/${total})…`,
        duration: 0
      });
      try {
        const res = await apiFetch(`/api/admin/composite-prompt/${t.subject}/${t.year}`, {
          method: 'POST'
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        const saved = json.prompt;
        // Rows are immutable — append the new version, keep the history.
        setComposites((prev) => [...prev, saved]);
        ok += 1;
      } catch (e) {
        fail += 1;
        message.error(`${label}: ${e.message}`);
      }
      setPublishProgress({ done: i + 1, total });
    }
    setPublishing(false);
    setPublishProgress(null);
    message.open({
      key,
      type: fail ? 'warning' : 'success',
      content: `Published ${ok}/${total} composite${total > 1 ? 's' : ''}${fail ? `, ${fail} failed` : ''}`,
      duration: 3
    });
    // Publish also snapshots tier drafts into new immutable versions — reload
    // so the tier diffs and statuses reflect the new versions.
    if (ok) load();
  }, [publishTargets, load]);

  const onPublishClick = doPublish;

  // Publish status for the current selection: exact for a full (subject,
  // year) path, else a rollup across the target set.
  const publishStatus = useMemo(() => {
    if (sel.subject && sel.year) {
      const pub = publishedFor(sel.subject, sel.year);
      if (!pub) return { type: 'muted', text: 'Not published' };
      if (isStale(sel.subject, sel.year)) {
        return { type: 'warning', text: `Stale — v${pub.version} published, tiers changed since` };
      }
      return { type: 'success', text: `Published v${pub.version} · ${formatDateTime(pub.refinedAt)}` };
    }
    const published = publishTargets.filter((t) => publishedFor(t.subject, t.year)).length;
    const stale = publishTargets.filter((t) => isStale(t.subject, t.year)).length;
    return {
      type: stale ? 'warning' : 'muted',
      text: `${published}/${publishTargets.length} published${stale ? `, ${stale} stale` : ''}`
    };
  }, [sel.subject, sel.year, publishedFor, isStale, publishTargets]);

  // Version diff for the preview drawer. For a full (subject, year) path we
  // compare the "current" against the "previous version": current is the
  // unpublished draft (raw composition) when tiers changed since the last
  // publish — or nothing's published yet — otherwise it's the latest version.
  const fullPath = !!(sel.subject && sel.year);

  // The Composite Diff tab only exists for a year node. If the admin was on it
  // and then selects a global/subject node, fall back to the Diff tab.
  useEffect(() => {
    if (!fullPath && activeEditorTab === 'composite') setActiveEditorTab('diff');
  }, [fullPath, activeEditorTab]);

  const pathVersions = fullPath ? versionsFor(sel.subject, sel.year) : [];
  const latestVersion = pathVersions[0] || null;
  const prevVersion = pathVersions[1] || null;
  const showDraft = fullPath && (isStale(sel.subject, sel.year) || !latestVersion);

  const diff = !fullPath
    ? null
    : showDraft
      ? {
          oldText: latestVersion?.content ?? '',
          oldLabel: latestVersion
            ? `v${latestVersion.version} · published ${formatDateTime(latestVersion.refinedAt)}`
            : 'Nothing published yet',
          newText: composite,
          newLabel: 'Unpublished draft (raw composition)'
        }
      : {
          oldText: prevVersion?.content ?? '',
          oldLabel: prevVersion
            ? `v${prevVersion.version} · ${formatDateTime(prevVersion.refinedAt)}`
            : 'No earlier version',
          newText: latestVersion?.content ?? '',
          newLabel: `v${latestVersion.version} · current`
        };

  const drawerSubtitle = !fullPath
    ? 'Select a year to compare published versions. Showing the raw composition for this path.'
    : showDraft
      ? latestVersion
        ? 'Unpublished draft vs the latest published version. Publishing re-refines the draft with AI.'
        : 'Nothing published yet — this is the raw composition that will be refined on publish.'
      : prevVersion
        ? 'Current version vs the previous one.'
        : 'Only one version exists — nothing to compare yet.';

  // Version diff for the selected TIER (global / subject / year): the current
  // draft (live editor content) against the latest published version.
  const tierVersions = tierVersionsFor(activeScope, activeKey);
  const tierLatest = tierVersions[0] || null;
  const tierDiff = {
    oldText: tierLatest?.content ?? '',
    oldLabel: tierLatest
      ? `v${tierLatest.version} · published ${formatDateTime(tierLatest.updatedAt)}`
      : 'No published version yet',
    newText: draft,
    newLabel: 'Draft (current)'
  };
  const tierSubtitle = tierLatest
    ? 'Current draft vs the latest published version of this tier.'
    : 'Current draft — this tier has no published version yet.';

  // Diff panes sit under the tab bar plus a one-line subtitle.
  const diffPaneHeight = Math.max(
    MIN_EDITOR_HEIGHT,
    areaHeight - COL_HEADER_H - TAB_BAR_H - 30
  );

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={load}>
              Retry
            </Button>
          }
        />
      )}

      <Paragraph style={{ color: palette.textMuted, marginTop: 0 }}>
        Each turn Brain receives one composite prompt (<Text strong>global + subject + year</Text>).
        Edit a tier on the left — changes autosave to a mutable draft in
        realtime. The <Text strong>Diff</Text> tab compares the draft against
        the last published version. <Text strong>Publish</Text> snapshots the source tier
        drafts into immutable versions and runs an AI refinement that merges
        them into a new composite version students receive. Unpublished
        (subject, year) pairs fall back to the raw draft composition.
      </Paragraph>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin />
        </div>
      ) : (
        <div ref={rowRef} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Left: navigation tree */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              borderRight: `1px solid ${palette.borderSoft}`,
              paddingRight: 12,
              maxHeight: areaHeight,
              overflowY: 'auto'
            }}
          >
            <Tree
              blockNode
              treeData={treeData}
              selectedKeys={[selectedKey]}
              defaultExpandAll
              switcherIcon={({ expanded, isLeaf }) =>
                isLeaf ? null : expanded ? <MinusSquareOutlined /> : <PlusSquareOutlined />
              }
              onSelect={(keys) => {
                // Ignore the deselect click so a node always stays active.
                if (keys.length) setSelectedKey(keys[0]);
              }}
            />
          </div>

          {/* Right: editor + diff tabs for the selected node */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 8
              }}
            >
              <div>
                <Text strong>{targetLabel}</Text>
                <div style={{ color: palette.textMuted, fontSize: 12 }}>{targetHint}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <Button type="primary" loading={publishing} onClick={onPublishClick}>
                  {publishing
                    ? publishProgress
                      ? `Publishing ${publishProgress.done}/${publishProgress.total}…`
                      : 'Publishing…'
                    : publishTargets.length > 1
                      ? `Publish ${publishTargets.length}`
                      : 'Publish'}
                </Button>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  {publishStatus.type === 'muted' ? (
                    <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                      {publishStatus.text}
                    </Text>
                  ) : (
                    <Text type={publishStatus.type} style={{ fontSize: 12 }}>
                      {publishStatus.text}
                    </Text>
                  )}
                </div>
              </div>
            </div>
            <Tabs
              activeKey={activeEditorTab}
              onChange={setActiveEditorTab}
              items={[
                {
                  key: 'editor',
                  label: 'Editor',
                  children: (
                    <>
                      <div data-color-mode="light">
                        <MDEditor
                          value={draft}
                          onChange={(value) => setDraft(value ?? '')}
                          height={Math.max(
                            MIN_EDITOR_HEIGHT,
                            areaHeight - COL_HEADER_H - TAB_BAR_H - EDITOR_FOOTER_H
                          )}
                          preview="edit"
                          textareaProps={{
                            placeholder:
                              'Write the prompt in Markdown — use the toolbar for headings, bold, lists, code blocks…'
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 12
                        }}
                      >
                        <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                          {tierLatest
                            ? `Draft · last published v${tierLatest.version}`
                            : 'Draft · never published'}
                        </Text>
                        <SaveStatus saving={saving} dirty={dirty} empty={!draft.trim()} />
                      </div>
                    </>
                  )
                },
                {
                  key: 'diff',
                  label: 'Diff',
                  children: (
                    <>
                      <Paragraph style={{ color: palette.textMuted, fontSize: 12, marginTop: 0 }}>
                        {tierSubtitle}
                      </Paragraph>
                      <SplitDiff
                        oldText={tierDiff.oldText}
                        newText={tierDiff.newText}
                        oldLabel={tierDiff.oldLabel}
                        newLabel={tierDiff.newLabel}
                        height={diffPaneHeight}
                      />
                    </>
                  )
                },
                // Composite diff only makes sense at a full (subject, year)
                // path — i.e. a year node. Global/subject nodes omit it.
                ...(fullPath && diff
                  ? [
                      {
                        key: 'composite',
                        label: 'Composite Diff',
                        children: (
                          <>
                            <Paragraph
                              style={{ color: palette.textMuted, fontSize: 12, marginTop: 0 }}
                            >
                              {drawerSubtitle}
                            </Paragraph>
                            <SplitDiff
                              oldText={diff.oldText}
                              newText={diff.newText}
                              oldLabel={diff.oldLabel}
                              newLabel={diff.newLabel}
                              height={diffPaneHeight}
                            />
                          </>
                        )
                      }
                    ]
                  : [])
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setError(null);
      setSubmitting(false);
    }
  }, [open, form]);

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      message.success('Password updated');
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Change password"
      centered
      onCancel={submitting ? undefined : onClose}
      maskClosable={!submitting}
      keyboard={!submitting}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={submit}>
          Update password
        </Button>
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
        <Form.Item
          label="Current password"
          name="currentPassword"
          rules={[{ required: true, message: 'Enter your current password' }]}
        >
          <Input.Password
            autoComplete="current-password"
            prefix={<LockOutlined style={{ color: palette.textMuted }} />}
          />
        </Form.Item>
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: 'Enter a new password' },
            {
              min: MIN_PASSWORD_LENGTH,
              message: `Must be at least ${MIN_PASSWORD_LENGTH} characters`
            }
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            prefix={<LockOutlined style={{ color: palette.textMuted }} />}
          />
        </Form.Item>
        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Confirm the new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              }
            })
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            prefix={<LockOutlined style={{ color: palette.textMuted }} />}
            onPressEnter={submit}
          />
        </Form.Item>
        {error && <Alert type="error" showIcon message={error} style={{ marginTop: 4 }} />}
      </Form>
    </Modal>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => authSession().user);
  const isAdmin = currentUser?.role === 'admin';

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin · YouTutorAI';
  }, []);

  const handleSignOut = () => {
    Modal.confirm({
      title: 'Sign out?',
      content: 'You will need to sign in again to manage users.',
      okText: 'Sign out',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      centered: true,
      onOk: () => {
        authSession().clear();
        setCurrentUser(null);
        navigate('/');
      }
    });
  };

  const submit = async () => {
    if (!userName.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const data = await postJson('/api/auth/password', {
        userName: userName.trim(),
        password
      });
      if (data.user.role !== 'admin') {
        setError('Only admin users can sign in here');
        return;
      }
      authSession().save(data);
      setCurrentUser(data.user);
      setUserName('');
      setPassword('');
      message.success(`Welcome, ${data.user.name}!`);
    } catch (e) {
      setError(e.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: palette.bg,
        color: palette.text,
        padding: 24
      }}
    >
      {isAdmin && (
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '4px 0',
              marginBottom: 16
            }}
          >
            <Logo height={24} />
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'password',
                    icon: <LockOutlined />,
                    label: 'Change password',
                    onClick: () => setChangePasswordOpen(true)
                  },
                  { type: 'divider' },
                  {
                    key: 'signout',
                    icon: <LogoutOutlined />,
                    label: 'Sign out',
                    danger: true,
                    onClick: handleSignOut
                  }
                ]
              }}
            >
              <Button icon={<UserOutlined />}>
                {currentUser?.name || 'Account'} <DownOutlined />
              </Button>
            </Dropdown>
          </div>
          <Tabs
            defaultActiveKey="users"
            type="card"
            items={[
              {
                key: 'users',
                label: 'Users',
                children: <UsersPanel />
              },
              {
                key: 'prompts',
                label: 'Agent prompts',
                children: <AgentPromptsPanel />
              }
            ]}
          />
          <ChangePasswordModal
            open={changePasswordOpen}
            onClose={() => setChangePasswordOpen(false)}
          />
        </div>
      )}

      <Modal
        open={!isAdmin}
        title="Admin sign-in"
        centered
        maskClosable={false}
        keyboard={false}
        closable={false}
        footer={[
          <Button key="cancel" onClick={() => navigate('/')}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={submit}
            disabled={!userName.trim() || !password}
          >
            Sign in
          </Button>
        ]}
      >
        <Paragraph style={{ color: palette.textMuted, marginTop: 0 }}>
          Admin-only area. Other users should sign in from the home page.
        </Paragraph>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            size="large"
            autoComplete="username"
            placeholder="Username"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setError(null);
            }}
            prefix={<UserOutlined style={{ color: palette.textMuted }} />}
            style={{ height: 48, borderRadius: radius.md }}
            autoFocus
          />
          <Input.Password
            size="large"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            onPressEnter={submit}
            prefix={<LockOutlined style={{ color: palette.textMuted }} />}
            style={{ height: 48, borderRadius: radius.md }}
          />
          {error && <Alert type="error" showIcon message={error} />}
        </div>
      </Modal>
    </div>
  );
}
