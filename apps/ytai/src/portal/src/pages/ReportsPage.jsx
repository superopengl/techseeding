import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  LoadingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import SUBJECTS from '../lib/subjects.js';
import apiFetch from '../lib/apiFetch.js';
import currentSubject from '../lib/currentSubject.js';
import currentYear, { YEARS } from '../lib/currentYear.js';
import { palette } from '../theme.js';
import MarkdownMessage from '../components/MarkdownMessage.jsx';
import NavMenuDrawer from '../components/NavMenuDrawer.jsx';

const POLL_INTERVAL_MS = 10000;

// Time windows the user can pick on the Generate panel. `days: null`
// means "all sessions" — the backend skips the createdAt filter entirely.
const TIMESPAN_OPTIONS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 91, label: '3 months' },
  { value: 183, label: '6 months' },
  { value: null, label: 'All sessions' }
];
const DEFAULT_TIMESPAN_DAYS = 30;

// Prompt templates — UI-only sugar. The cards on the Generate panel
// use these to prefill the textarea; the backend never sees the key,
// only the resulting prompt string. Each card carries its own tint +
// border so the three options read as distinct at a glance.
const PROMPT_TEMPLATES = [
  {
    key: 'wrong_questions',
    label: 'Wrong Answer Journal',
    blurb: 'Every question the student got wrong or struggled with, with the correct answer and mistake type.',
    prompt:
      'List every question the student got wrong or struggled with across their recent sessions. For each one, include the question, the student\'s answer, the correct answer, and what kind of mistake it was.'
  },
  {
    key: 'strengths_weaknesses',
    label: 'Strengths & Weaknesses',
    blurb: 'Where the student is solid and where they need practice, with concrete evidence from sessions.',
    prompt:
      'Tell me where the student is solid and where they need more practice. Back each strength and weakness with concrete examples from their sessions.'
  },
  {
    key: 'curriculum_map',
    label: 'Curriculum Map',
    blurb: 'Coverage by focus area and mastery state, against the NSW K-10 syllabus.',
    prompt:
      'Map the student\'s recent tutoring work against the NSW K-10 syllabus. For each focus area they have touched, give a mastery state (e.g. emerging / developing / proficient) and the evidence behind it.'
  }
];

// Reports carry a model-generated title in their content payload — the
// pre-title call lands it within seconds of a row being created. Falls
// back to a placeholder for the brief window before the title write,
// for rows where it never landed, or for legacy rows.
function reportDisplayTitle(report) {
  const t = typeof report.content?.title === 'string' ? report.content.title.trim() : '';
  if (t) return t;
  return 'Generating Report ...';
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 45) return 'just now';
  if (secs < 90) return '1 minute ago';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.round(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function PromptCard({ prompt, style }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write can fail on insecure contexts; silently no-op.
    }
  };
  return (
    <div style={style}>
      <Card
        size="small"
        style={{ background: palette.bgPanel }}
        styles={{ body: { padding: 12 } }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>Your prompt</Typography.Text>
        <Typography.Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
          {prompt}
        </Typography.Paragraph>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Tooltip title={copied ? 'Copied' : 'Copy prompt'}>
          <Button
            type="link"
            size="small"
            shape='circle'
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            aria-label={copied ? 'Prompt copied' : 'Copy prompt to clipboard'}
          />
        </Tooltip>
      </div>
    </div>
  );
}

function SubjectBadge({ subject, size = 'sm' }) {
  const meta = SUBJECTS.find((s) => s.key === subject);
  if (!meta) return null;
  const Icon = meta.icon;
  const isLg = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isLg ? 8 : 6,
        padding: isLg ? '4px 12px 4px 6px' : '2px 10px 2px 4px',
        background: meta.tint,
        border: `1.5px solid ${meta.color}`,
        borderRadius: 999,
        color: palette.text,
        fontWeight: 700,
        fontSize: isLg ? 14 : 12,
        lineHeight: 1.2,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: isLg ? 22 : 18,
          height: isLg ? 22 : 18,
          borderRadius: '50%',
          background: meta.color,
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isLg ? 12 : 10,
          flexShrink: 0
        }}
      >
        <Icon />
      </span>
      {meta.label}
    </span>
  );
}

// Compact subject pill for the dense report-select trigger/dropdown row.
// Mirrors HeaderSubjectChip on the TutorPage so the two pages feel of a
// piece.
function HeaderSubjectChip({ subject }) {
  const meta = SUBJECTS.find((s) => s.key === subject);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '0 5px 0 4px',
        border: `1px solid ${meta.color}`,
        background: meta.tint,
        borderRadius: 999,
        color: palette.text,
        fontSize: 9,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap'
      }}
    >
      <Icon style={{ color: meta.color, fontSize: 9 }} />
      {meta.label}
    </span>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customSubject, setCustomSubject] = useState(() => currentSubject().value);
  const [customTimespanDays, setCustomTimespanDays] = useState(DEFAULT_TIMESPAN_DAYS);
  const [customYear, setCustomYear] = useState(() => currentYear().value);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const updateSubject = useCallback((next) => {
    setCustomSubject(next);
    currentSubject().save(next);
  }, []);

  const updateYear = useCallback((next) => {
    if (next === customYear) return;
    setCustomYear(next);
    currentYear().save(next);
    apiFetch('/api/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: next })
    }).catch((err) => {
      console.error('Failed to save year preference', err);
    });
  }, [customYear]);

  // Hydrate the year from the server profile so the default matches what the
  // user picked elsewhere (e.g. on the Tutor page) even on a fresh browser.
  // localStorage primes the initial value so the radio isn't blank during
  // the fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/me/profile');
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        if (body?.year) {
          setCustomYear(body.year);
          currentYear().save(body.year);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/analysis-reports');
      if (!res.ok) throw new Error("Couldn't load your reports");
      const body = await res.json();
      setReports(body.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId]
  );

  // Pending ids live in a ref so the polling effect can read the latest set
  // without re-binding the interval every time a status flips.
  const pendingIdsRef = useRef([]);
  pendingIdsRef.current = reports.filter((r) => r.status === 'pending').map((r) => r.id);

  // While any row is still 'pending' on the server, poll *just those rows*
  // (via `?ids=`) so the card flips to 'ready' / 'failed' without the user
  // clicking refresh. Refetching the full history every 2.5s would pull
  // every already-ready row back over the wire for nothing.
  const hasPendingReport = pendingIdsRef.current.length > 0;
  useEffect(() => {
    if (!hasPendingReport) return undefined;
    const tick = async () => {
      const ids = pendingIdsRef.current;
      if (ids.length === 0) return;
      try {
        const res = await apiFetch(`/api/analysis-reports?ids=${encodeURIComponent(ids.join(','))}`);
        if (!res.ok) return;
        const body = await res.json();
        const fresh = body.reports || [];
        if (fresh.length === 0) return;
        setReports((prev) => {
          const byId = new Map(fresh.map((r) => [r.id, r]));
          return prev.map((r) => byId.get(r.id) ?? r);
        });
      } catch {
        // Best-effort: a transient network blip just means the user waits
        // one more tick. No need to surface this to the UI.
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasPendingReport]);

  const handleSubmit = useCallback(async () => {
    const trimmed = customPrompt.trim();
    if (!trimmed) {
      message.warning('Write a prompt first.');
      return;
    }
    setGenerating(`${customSubject}::${trimmed}`);
    try {
      const res = await apiFetch('/api/analysis-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: customSubject,
          year: customYear,
          prompt: trimmed,
          timespanDays: customTimespanDays
        })
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Couldn't generate the report");
      }
      if (body.status === 'empty') {
        message.info('No sessions for this subject yet — finish a session in the tutor first.');
        return;
      }
      // The row is now 'pending' in the database. Pull the new card into
      // the list and jump straight to its in-progress viewer so the user
      // can watch the generation finish.
      message.info('Generating report…');
      setCustomPrompt('');
      await loadReports();
      if (body.id) setSelectedId(body.id);
    } catch (err) {
      message.error(err.message);
    } finally {
      setGenerating(null);
    }
  }, [customPrompt, customSubject, customTimespanDays, customYear, loadReports]);

  const handleGenerateSimilar = useCallback(
    (report) => {
      updateSubject(report.subject);
      setCustomPrompt(report.customPrompt || '');
      setSelectedId(null);
    },
    [updateSubject]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        const res = await apiFetch(`/api/analysis-report/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Couldn't delete that report");
        }
        message.success('Report deleted');
        setSelectedId(null);
        await loadReports();
      } catch (err) {
        message.error(err.message);
      }
    },
    [loadReports]
  );

  return (
    <div style={{ height: '100vh', background: palette.bgPanel, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 24px 12px 12px',
          background: palette.surface,
          borderBottom: `1px solid ${palette.borderSoft}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0
        }}
      >
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, minWidth: 0, padding: '0 12px' }}>
          <ReportSelect
            loading={loading}
            value={selectedId}
            reports={reports}
            onChange={setSelectedId}
          />
        </div>
        <Tooltip title="New report">
          <Button
            type="text"
            icon={<FormOutlined />}
            onClick={() => setSelectedId(null)}
            aria-label="New report"
          />
        </Tooltip>
      </header>

      <NavMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div style={{ flex: 1, overflow: 'hidden', background: palette.surface }}>
        {error ? (
          <div style={{ padding: 16 }}>
            <Alert type="error" showIcon message={error} />
          </div>
        ) : selectedReport ? (
          <ReportPanel
            report={selectedReport}
            onDelete={handleDelete}
            onGenerateSimilar={handleGenerateSimilar}
          />
        ) : (
          <GeneratePanel
            generating={generating}
            customYear={customYear}
            setCustomYear={updateYear}
            customSubject={customSubject}
            setCustomSubject={updateSubject}
            customTimespanDays={customTimespanDays}
            setCustomTimespanDays={setCustomTimespanDays}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

// Centered report picker in the top nav. Mirrors TutorPage's SessionSelect
// — single-line trigger so the Select sits at AntD's 32px height beside
// the menu and New Report buttons; the dropdown rows render a richer
// two-line layout (title + subject chip + timestamp / status).
function ReportSelect({ loading, value, reports, onChange }) {
  const [open, setOpen] = useState(false);
  const options = reports.map((r) => ({
    value: r.id,
    label: reportDisplayTitle(r),
    report: r
  }));
  const listHeight = useDropdownListHeight(options.length);
  return (
    <>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: palette.overlay.scrim,
            // AntD Select's popup defaults to z-index 1050 — sit just below
            // so the dropdown reads above the scrim but page chrome below
            // gets dimmed.
            zIndex: 1040
          }}
          aria-hidden="true"
        />
      ) : null}
      <Select
        className="ytai-session-select"
        value={value ?? undefined}
        onChange={(id) => onChange?.(id)}
        open={open}
        onDropdownVisibleChange={setOpen}
        loading={loading}
        placeholder={loading ? 'Loading reports…' : 'Pick a report'}
        style={{ width: '100%', maxWidth: 480 }}
        optionLabelProp="label"
        notFoundContent={loading ? <Spin size="small" /> : 'No reports yet'}
        options={options}
        listHeight={listHeight}
        labelRender={({ value: id }) => {
          const r = reports.find((row) => row.id === id);
          if (!r) return null;
          return <ReportTriggerLabel report={r} />;
        }}
        optionRender={(option) => <ReportOptionContent report={option.data.report} />}
      />
    </>
  );
}

// Cap dropdown height at (viewport - 160px) for header chrome and a small
// gap below the dropdown. Each ReportOptionContent row renders at ~64px
// (title + chip row + date), so we also clamp to the natural list height
// to avoid an oversized empty pane when only a few reports exist.
const REPORT_OPTION_ROW_PX = 64;
function useDropdownListHeight(optionCount) {
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 768
  );
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const max = Math.max(256, viewportH - 160);
  const natural = Math.max(1, optionCount) * REPORT_OPTION_ROW_PX + 8;
  return Math.min(max, natural);
}

function ReportTriggerLabel({ report }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: palette.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: 1
        }}
      >
        {reportDisplayTitle(report)}
      </span>
      {report.subject ? <HeaderSubjectChip subject={report.subject} /> : null}
    </div>
  );
}

function ReportOptionContent({ report }) {
  const subjectMeta = SUBJECTS.find((s) => s.key === report.subject);
  const isPending = report.status === 'pending';
  const isFailed = report.status === 'failed';
  const absolute = formatDate(report.generatedAt || report.createdAt);
  const relative = formatTimeAgo(report.generatedAt || report.createdAt);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0', minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: palette.text,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {reportDisplayTitle(report)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {report.subject ? <HeaderSubjectChip subject={report.subject} /> : null}
        {isPending ? (
          <Space size={4} align="center">
            <LoadingOutlined style={{ color: subjectMeta?.color || palette.primary, fontSize: 11 }} />
            <Typography.Text style={{ fontSize: 11, color: subjectMeta?.color || palette.primary }}>
              Generating…
            </Typography.Text>
          </Space>
        ) : isFailed ? (
          <Space size={4} align="center">
            <ExclamationCircleOutlined style={{ color: palette.state.wrong, fontSize: 11 }} />
            <Typography.Text style={{ fontSize: 11, color: palette.state.wrong }}>
              Failed
            </Typography.Text>
          </Space>
        ) : null}
        {!isPending && !isFailed && absolute ? (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: palette.textMuted,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {absolute}
            {relative ? ` (${relative})` : ''}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GeneratePanel({
  generating,
  customYear,
  setCustomYear,
  customSubject,
  setCustomSubject,
  customTimespanDays,
  setCustomTimespanDays,
  customPrompt,
  setCustomPrompt,
  onSubmit
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const isGenerating = generating?.startsWith(`${customSubject}::`);
  const hasPrompt = customPrompt.trim().length > 0;

  const advance = () => setCurrentStep((s) => Math.min(s + 1, 3));
  const pickYear = (y) => { setCustomYear(y); advance(); };
  const pickSubject = (k) => { setCustomSubject(k); advance(); };
  const pickTimespan = (days) => { setCustomTimespanDays(days); advance(); };

  const optionColStyle = { width: '100%', maxWidth: 360, margin: '0 auto', display: 'flex' };

  const steps = [
    {
      title: 'Year',
      content: (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Choose the year
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Which year level is the student in? This anchors the AI's expectations.
          </Typography.Paragraph>
          <Space direction="vertical" size="small" style={optionColStyle}>
            {YEARS.map((y) => (
              <Button
                key={y}
                block
                size="large"
                type={customYear === y ? 'primary' : 'default'}
                onClick={() => pickYear(y)}
              >
                {y}
              </Button>
            ))}
          </Space>
        </>
      )
    },
    {
      title: 'Subject',
      content: (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Choose a subject
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Which subject's tutoring work should the AI analyze?
          </Typography.Paragraph>
          <Space direction="vertical" size="small" style={optionColStyle}>
            {SUBJECTS.map((s) => {
              const Icon = s.icon;
              const selected = customSubject === s.key;
              return (
                <Button
                  key={s.key}
                  block
                  size="large"
                  icon={<Icon style={{ color: selected ? '#fff' : s.color }} />}
                  type={selected ? 'primary' : 'default'}
                  onClick={() => pickSubject(s.key)}
                >
                  {s.label}
                </Button>
              );
            })}
          </Space>
        </>
      )
    },
    {
      title: 'Time span',
      content: (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Pick a time span
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            How far back should the AI look? Only sessions started within this window are included.
          </Typography.Paragraph>
          <Space direction="vertical" size="small" style={optionColStyle}>
            {TIMESPAN_OPTIONS.map((o) => {
              const selected = customTimespanDays === o.value;
              return (
                <Button
                  key={o.value ?? 'all'}
                  block
                  size="large"
                  type={selected ? 'primary' : 'default'}
                  onClick={() => pickTimespan(o.value)}
                >
                  {o.label}
                </Button>
              );
            })}
          </Space>
        </>
      )
    },
    {
      title: 'Prompt',
      content: (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Tell the AI what to analyze
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Start from a template, then tweak the prompt before generating.
          </Typography.Paragraph>
          <div
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              background: '#fff',
              padding: 12
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 10
              }}
            >
              {PROMPT_TEMPLATES.map((t) => (
                <Card
                  key={t.key}
                  hoverable
                  size="small"
                  onClick={() => setCustomPrompt(t.prompt)}
                  styles={{ body: { padding: 10 } }}
                  style={{
                    cursor: 'pointer',
                    background: palette.tint.primary,
                    borderColor: palette.tint.primary
                  }}
                >
                  <Typography.Text style={{ display: 'block', marginBottom: 2, fontSize: 13 }}>
                    {t.label}
                  </Typography.Text>
                  <Typography.Paragraph
                    style={{
                      fontSize: 12,
                      lineHeight: 1.25,
                      marginBottom: 0,
                      color: palette.textMuted
                    }}
                  >
                    {t.blurb}
                  </Typography.Paragraph>
                </Card>
              ))}
            </div>
            <Input.TextArea
              variant="borderless"
              autoSize={{ minRows: 4 }}
              maxLength={2000}
              placeholder='Pick a template above to start, or write your own — e.g. "Which concepts has my child confused the most in the last week?"'
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              style={{ padding: '4px 0', resize: 'none', overflow: 'hidden' }}
            />
          </div>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              loading={isGenerating}
              disabled={!hasPrompt}
              onClick={onSubmit}
            >
              Generate
            </Button>
          </div>
        </>
      )
    }
  ];

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: palette.surface
      }}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 24px 64px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: 640, width: '100%' }}>
          <Progress
            percent={((currentStep + 1) / steps.length) * 100}
            showInfo={false}
            strokeColor={palette.cta}
            style={{ marginBottom: 16 }}
          />

          <Typography.Title level={4} style={{ marginTop: 0 }}>
            Generate a new report
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Reports turn the student's tutoring sessions into a clear picture — what they got wrong, what they've got down, and what to work on next. Each report is saved as a snapshot you can come back to.
          </Typography.Paragraph>

          {currentStep > 0 ? (
            <Button
              type="link"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{ paddingLeft: 0, marginBottom: 8 }}
            >
              Back
            </Button>
          ) : null}

          <div>{steps[currentStep].content}</div>
        </div>
      </div>
    </div>
  );
}

function ReportPanel({ report, onDelete, onGenerateSimilar }) {
  const subjectMeta = SUBJECTS.find((s) => s.key === report.subject);
  const subjectLabel = subjectMeta?.label || report.subject;
  const typeLabel = reportDisplayTitle(report);
  const isPending = report.status === 'pending';
  const isFailed = report.status === 'failed';
  const [modal, modalContextHolder] = Modal.useModal();
  const handleDeleteClick = () => {
    modal.confirm({
      title: 'Delete this report?',
      content: `"${typeLabel}" for ${subjectLabel} will be permanently removed. You can regenerate it later, but the current snapshot is gone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => onDelete(report.id)
    });
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: palette.surface }}>
      {modalContextHolder}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${palette.borderSoft}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={10} align="center" style={{ marginBottom: 4 }}>
            <SubjectBadge subject={report.subject} size="lg" />
            <Typography.Title level={4} style={{ margin: 0 }}>{typeLabel}</Typography.Title>
          </Space>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {isPending
                ? `Started ${formatDate(report.createdAt)} (${formatTimeAgo(report.createdAt)})`
                : `Generated ${formatDate(report.generatedAt || report.createdAt)} (${formatTimeAgo(report.generatedAt || report.createdAt)})`}
            </Typography.Text>
          </div>
        </div>
        {!isPending && (
          <Space size={4}>
            {report.customPrompt ? (
              <Button
                type="link"
                size="small"
                onClick={() => onGenerateSimilar?.(report)}
              >
                Generate Similar
              </Button>
            ) : null}
            <Button
              type="text"
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={handleDeleteClick}
              aria-label="Delete report"
              danger
            />
          </Space>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {isPending ? (
          <PendingReportBody report={report} />
        ) : isFailed ? (
          <FailedReportBody report={report} />
        ) : (
          <ReportBody report={report} />
        )}
      </div>
    </div>
  );
}

function PendingReportBody({ report }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <Spin
        size="large"
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      />
      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 4 }}>
        Generating report…
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        This usually takes a few seconds. The page refreshes automatically when it's ready.
      </Typography.Paragraph>
      {report.customPrompt ? (
        <PromptCard prompt={report.customPrompt} style={{ marginTop: 24, textAlign: 'left' }} />
      ) : null}
    </div>
  );
}

function FailedReportBody({ report }) {
  return (
    <div>
      <Alert
        type="error"
        showIcon
        message="Report generation failed"
        description={report.error || 'Something went wrong generating this report. Try again.'}
      />
      {report.customPrompt ? (
        <PromptCard prompt={report.customPrompt} style={{ marginTop: 16 }} />
      ) : null}
    </div>
  );
}

function ReportBody({ report }) {
  const content = report.content || {};
  return (
    <div>
      {report.customPrompt ? (
        <PromptCard prompt={report.customPrompt} style={{ marginBottom: 16 }} />
      ) : null}
      {content.narrative ? (
        <div
          style={{
            color: palette.textInkSoft,
            fontSize: 15,
            lineHeight: 1.65,
            marginBottom: content.sections?.length ? 16 : 0
          }}
        >
          <MarkdownMessage>{content.narrative}</MarkdownMessage>
        </div>
      ) : null}
      {Array.isArray(content.sections) && content.sections.length > 0
        ? content.sections.map((s, i) => (
            <Card
              key={i}
              size="small"
              style={{ marginBottom: 10, borderColor: palette.borderSoft }}
              styles={{ body: { padding: 16 } }}
            >
              <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                {s.title}
              </Typography.Title>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                {(s.bullets || []).map((b, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    <MarkdownMessage>{b}</MarkdownMessage>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        : null}
    </div>
  );
}
