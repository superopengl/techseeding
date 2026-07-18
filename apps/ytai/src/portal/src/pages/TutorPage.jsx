import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Drawer, Dropdown, Grid, Input, message, Modal, Select, Space, Splitter, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, FormOutlined, MenuOutlined, MoreOutlined } from '@ant-design/icons';
import PagedCanvas from '../components/PagedCanvas.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import NavMenuDrawer from '../components/NavMenuDrawer.jsx';
import apiFetch from '../lib/apiFetch.js';
import currentSubject from '../lib/currentSubject.js';
import currentYear, { YEARS } from '../lib/currentYear.js';
import SUBJECTS from '../lib/subjects.js';
import { palette } from '../theme.js';

export default function TutorPage() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(routeSessionId ?? null);
  const [docs, setDocs] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Map<imageId, Array<{id, args}>>
  const [aiAnnotationsByPage, setAiAnnotationsByPage] = useState(() => new Map());
  const [creatingSession, setCreatingSession] = useState(false);
  const [subject, setSubject] = useState(() => currentSubject().value);
  const [year, setYear] = useState(() => currentYear().value);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // List of every session owned by the user, fed into the header Select
  // so the user can jump between sessions. Bumped via `sessionsRefresh`
  // when something the GET wouldn't otherwise re-trigger changes (rename,
  // delete). Null while the first fetch is in flight.
  const [sessions, setSessions] = useState(null);
  const [sessionsRefresh, setSessionsRefresh] = useState(0);
  // AntD breakpoint: !md => below 768px = phone/narrow tablet. On narrow
  // we replace the 3-pane Splitter (sider | canvas | chat) with a single
  // full-width ChatPanel + a thumbnail button that pops the canvas in a
  // Drawer, since three side-by-side panes can't share a phone viewport.
  const screens = Grid.useBreakpoint();
  const isNarrow = !screens.md;
  const [canvasDrawerOpen, setCanvasDrawerOpen] = useState(false);

  // Close the canvas drawer if the user resizes back to a wide viewport,
  // otherwise the open state strands across breakpoints and would re-open
  // unexpectedly next time the viewport narrows.
  useEffect(() => {
    if (!isNarrow) setCanvasDrawerOpen(false);
  }, [isNarrow]);

  // Fetch the session list once per (sessionId, sessionsRefresh) tick.
  // Re-fetching when sessionId changes catches new sessions created via
  // the New Session button; the refresh counter catches rename/delete.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/tutor/sessions');
        if (!res.ok) throw new Error("Couldn't load your sessions");
        const body = await res.json();
        if (cancelled) return;
        setSessions(Array.isArray(body.sessions) ? body.sessions : []);
      } catch (err) {
        if (!cancelled) console.error('Failed to load sessions', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionsRefresh]);

  const [modal, modalContextHolder] = Modal.useModal();
  // Imperative handle on the canvas so ChatPanel can pull a flattened PNG
  // of (photo + freehand strokes) at send time. Routed via a stable
  // callback so re-renders don't tear down the listener inside ChatPanel.
  const canvasRef = useRef(null);
  const getAnnotatedImage = useCallback(() => canvasRef.current?.flatten?.() ?? null, []);

  // Reset doc/canvas state when switching sessions; ChatPanel re-hydrates
  // via onDocsLoaded after its history fetch completes.
  useEffect(() => {
    setDocs([]);
    setCurrentDocId(null);
    setCurrentPage(1);
    setAiAnnotationsByPage(new Map());
  }, [sessionId]);

  const onSelectSession = useCallback(
    (id) => {
      if (!id || id === sessionId) return;
      navigate(`/tutor/${id}`);
    },
    [navigate, sessionId]
  );

  const onSessionDeleted = useCallback(
    (deletedId) => {
      setSessionsRefresh((n) => n + 1);
      if (deletedId === sessionId) navigate('/tutor', { replace: true });
    },
    [navigate, sessionId]
  );

  // Fired when ChatPanel's history fetch comes back 404 — the sessionId
  // in the URL doesn't point at any session this user owns (stale link,
  // typo, deleted from another tab). Bounce back to /tutor so it can pick
  // the most-recent session (or kick off a new one) instead of stranding
  // the user on a broken /tutor/:sessionId.
  const handleSessionNotFound = useCallback(() => {
    navigate('/tutor', { replace: true });
  }, [navigate]);

  const onSessionRenamed = useCallback(() => {
    // The session list's GET response carries the title, so a refresh is
    // enough to flow the new name into the header Select.
    setSessionsRefresh((n) => n + 1);
  }, []);

  // Rename / delete for the active session — surfaced via the kebab in the
  // top bar next to the SessionSelect. Prefill uses the session list's
  // title-then-preview fallback (same source the Select label uses), so
  // there's no need to wait on the messages history fetch.
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const handleDeleteSession = useCallback(() => {
    if (!sessionId) return;
    modal.confirm({
      title: 'Delete this session?',
      content: "This permanently removes the chat, images, and any reports. You can't undo it.",
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await apiFetch(`/api/tutor/${sessionId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Couldn't delete that session");
          onSessionDeleted(sessionId);
        } catch (err) {
          message.error(err.message || "Couldn't delete that session");
        }
      }
    });
  }, [modal, sessionId, onSessionDeleted]);

  const openRename = useCallback(() => {
    if (!sessionId) return;
    const active = (sessions ?? []).find((s) => s.id === sessionId);
    const title = typeof active?.title === 'string' ? active.title.trim() : '';
    let initial = title;
    if (!initial) {
      const preview = typeof active?.preview === 'string' ? active.preview.trim() : '';
      initial = preview.replace(/\s+/g, ' ').slice(0, 80);
    }
    setRenameDraft(initial);
    setRenameOpen(true);
  }, [sessionId, sessions]);

  const submitRename = useCallback(async () => {
    if (!sessionId || renameSaving) return;
    const trimmed = renameDraft.trim();
    setRenameSaving(true);
    try {
      const res = await apiFetch(`/api/tutor/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed.length === 0 ? null : trimmed })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't rename that session");
      }
      setRenameOpen(false);
      onSessionRenamed();
    } catch (err) {
      message.error(err.message || "Couldn't rename that session");
    } finally {
      setRenameSaving(false);
    }
  }, [sessionId, renameDraft, renameSaving, onSessionRenamed]);

  // The "+ New Session" tab — and the no-session-yet landing path — opens
  // this wizard. The kid picks year, then subject, and the session is
  // created the moment subject is tapped (no explicit Create button).
  // Defaults come from the page-level state (hydrated from the user
  // profile + the most recently opened session) so the wizard opens on
  // what they most likely want.
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const onNewSession = useCallback(() => {
    setNewSessionOpen(true);
  }, []);

  const confirmNewSession = useCallback(async ({ year: nextYear, subject: nextSubject }) => {
    if (creatingSession) return;
    setCreatingSession(true);
    try {
      const res = await apiFetch('/api/tutor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: nextSubject, year: nextYear })
      });
      if (!res.ok) throw new Error("Couldn't start a new session");
      const body = await res.json();
      // Persist the picks as the new defaults for the next session. The
      // year also propagates back to the user profile so the choice
      // follows the kid across browsers.
      setSubject(nextSubject);
      currentSubject().save(nextSubject);
      setYear(nextYear);
      currentYear().save(nextYear);
      if (nextYear !== year) {
        apiFetch('/api/me/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year: nextYear })
        }).catch((err) => {
          console.error('Failed to save year preference', err);
        });
      }
      setNewSessionOpen(false);
      navigate(`/tutor/${body.sessionId}`);
    } catch (err) {
      message.error(err.message || "Couldn't start a new session");
    } finally {
      setCreatingSession(false);
    }
  }, [creatingSession, navigate, year]);

  // Hydrate the year from the server profile on mount. localStorage primes
  // the initial render so the dropdown isn't blank during the fetch; if the
  // server has a different value, replace what we cached.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/me/profile');
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        if (body?.year) {
          setYear(body.year);
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

  useEffect(() => {
    if (routeSessionId) {
      setSessionId(routeSessionId);
      return undefined;
    }
    // No route param means we're on /tutor — clear any stale sessionId
    // immediately so the header Select renders its placeholder while we
    // figure out where to send the kid next, instead of leaving a stale
    // UUID hanging in the trigger.
    setSessionId(null);
    let cancelled = false;
    (async () => {
      try {
        const listRes = await apiFetch('/api/tutor/sessions');
        if (!listRes.ok) throw new Error("Couldn't load your sessions");
        const list = await listRes.json();
        if (cancelled) return;
        const all = Array.isArray(list.sessions) ? list.sessions : [];
        const top = all.find((s) => s.subject === subject);
        if (top?.id) {
          navigate(`/tutor/${top.id}`, { replace: true });
          return;
        }
        // No session matches the kid's preferred subject — surface the
        // new-session wizard so they pick year + subject deliberately
        // instead of dropping into an auto-created default.
        if (!cancelled) setNewSessionOpen(true);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeSessionId, navigate, subject]);

  const handleDocsLoaded = useCallback(({ docs: loadedDocs, currentDocId: loadedCurrent, subject: loadedSubject, year: loadedYear, aiAnnotationsByPage: loadedAi }) => {
    setDocs(loadedDocs);
    setCurrentDocId(loadedCurrent);
    setCurrentPage(1);
    setAiAnnotationsByPage(loadedAi ?? new Map());
    // Mirror the active session's subject + year back into the page-level
    // defaults so the New Session modal opens on what the kid most likely
    // wants. Persisted so it survives reloads.
    if (loadedSubject) {
      setSubject(loadedSubject);
      currentSubject().save(loadedSubject);
    }
    if (loadedYear) {
      setYear(loadedYear);
      currentYear().save(loadedYear);
    }
  }, []);

  const handleDocCreated = useCallback((doc) => {
    setDocs((prev) => [...prev, doc]);
    setCurrentDocId(doc.id);
    setCurrentPage(1);
  }, []);

  const handleAiAnnotation = useCallback((annotation) => {
    const imageId = annotation.args?.imageId;
    if (!imageId) return;
    setAiAnnotationsByPage((prev) => {
      const map = new Map(prev);
      map.set(imageId, [...(map.get(imageId) ?? []), annotation]);
      return map;
    });
  }, []);

  const handleClearPageAi = useCallback((imageId) => {
    setAiAnnotationsByPage((prev) => {
      const map = new Map(prev);
      map.delete(imageId);
      return map;
    });
  }, []);

  const handleSelectDoc = useCallback(
    async (docId, pageNumber = 1) => {
      // On narrow screens the chat-bubble image IS the canvas affordance:
      // tapping it should pop the canvas drawer. Open it unconditionally
      // (even when the doc is already current) so re-tapping the same
      // worksheet brings the image back up after the drawer was dismissed.
      if (isNarrow) setCanvasDrawerOpen(true);
      if (!sessionId || !docId || docId === currentDocId) {
        setCurrentPage(pageNumber);
        return;
      }
      // Optimistic: set local state immediately, then PATCH the session so
      // the server knows which doc the next Brain turn is scoped to.
      setCurrentDocId(docId);
      setCurrentPage(pageNumber);
      try {
        const res = await apiFetch(`/api/tutor/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentDocId: docId })
        });
        if (!res.ok) throw new Error("Couldn't switch worksheets");
      } catch (err) {
        message.error(err.message || "Couldn't switch worksheets");
      }
    },
    [sessionId, currentDocId, isNarrow]
  );

  const currentDoc = docs.find((d) => d.id === currentDocId) ?? null;

  const chatPanel = (
    <ChatPanel
      sessionId={sessionId}
      currentDocId={currentDocId}
      currentPage={currentPage}
      docs={docs}
      onDocsLoaded={handleDocsLoaded}
      onDocCreated={handleDocCreated}
      onAiAnnotation={handleAiAnnotation}
      onSelectDoc={handleSelectDoc}
      onSessionNotFound={handleSessionNotFound}
      getAnnotatedImage={getAnnotatedImage}
    />
  );

  const pagedCanvas = currentDoc ? (
    <PagedCanvas
      ref={canvasRef}
      doc={currentDoc}
      sessionId={sessionId}
      currentPage={currentPage}
      onCurrentPageChange={setCurrentPage}
      aiAnnotationsByPage={aiAnnotationsByPage}
      onClearPageAi={handleClearPageAi}
    />
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: palette.bgPanel }}>
      {modalContextHolder}
      <NewSessionModal
        open={newSessionOpen}
        creating={creatingSession}
        required={!sessionId}
        defaultYear={year}
        defaultSubject={subject}
        onCreate={confirmNewSession}
        onCancel={() => setNewSessionOpen(false)}
      />
      <Modal
        title="Rename session"
        open={renameOpen}
        onCancel={() => (renameSaving ? null : setRenameOpen(false))}
        onOk={submitRename}
        okText="Save"
        confirmLoading={renameSaving}
        destroyOnHidden
      >
        <Input
          autoFocus
          maxLength={80}
          showCount
          placeholder="e.g. Fractions homework"
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onPressEnter={submitRename}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: palette.textMuted }}>
          Leave blank to fall back to the first-message preview.
        </div>
      </Modal>
      <header
        style={{
          padding: '12px 24px 12px 12px',
          background: palette.surface,
          borderBottom: `1px solid ${palette.borderSoft}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, minWidth: 0, padding: '0 12px' }}>
          <SessionSelect
            value={sessionId}
            sessions={sessions}
            onChange={onSelectSession}
          />
          {sessionId ? (
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'rename',
                    label: 'Rename',
                    icon: <EditOutlined />,
                    onClick: openRename
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    label: 'Delete this session',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: handleDeleteSession
                  }
                ]
              }}
            >
              <Button type="text" icon={<MoreOutlined />} aria-label="Session menu" />
            </Dropdown>
          ) : null}
        </div>
        <Tooltip title="Create new session">
          <Button
            type="text"
            icon={<FormOutlined />}
            loading={creatingSession}
            onClick={onNewSession}
            aria-label="Create new session"
          />
        </Tooltip>
      </header>
      <NavMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div style={{ flex: 1, minHeight: 0, background: palette.surface }}>
        {isNarrow ? (
          <>
            {chatPanel}
            <Drawer
              placement="right"
              open={canvasDrawerOpen}
              onClose={() => setCanvasDrawerOpen(false)}
              width="100%"
              title="Worksheet"
              destroyOnClose={false}
              // Mount the canvas eagerly so canvasRef is wired before the
              // student opens the drawer — ChatPanel pulls a flattened PNG
              // via getAnnotatedImage on send, and that has to work even
              // when the drawer has never been opened this turn.
              forceRender
              styles={{
                body: { padding: 8, display: 'flex', flexDirection: 'column' }
              }}
            >
              {pagedCanvas}
            </Drawer>
          </>
        ) : currentDoc ? (
          <Splitter style={{ height: '100%', minHeight: 0 }}>
            <Splitter.Panel key="canvas" defaultSize="58%" min="30%" max="80%">
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 4,
                  boxSizing: 'border-box'
                }}
              >
                {pagedCanvas}
              </div>
            </Splitter.Panel>
            <Splitter.Panel key="chat">{chatPanel}</Splitter.Panel>
          </Splitter>
        ) : (
          // No worksheet yet: skip the Splitter so the chat doesn't stretch
          // across an empty desktop. Cap at 500px and center, so the kid is
          // looking at a focused column instead of a wall of whitespace.
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 700, height: '100%' }}>
              {chatPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewSessionModal({
  open,
  creating,
  required,
  defaultYear,
  defaultSubject,
  onCreate,
  onCancel
}) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(defaultYear);
  const [pickedSubject, setPickedSubject] = useState(null);

  // Reset to step 0 every time the modal opens so the wizard always
  // starts at year selection, even if the kid bailed out mid-flow last
  // time. Tracking defaultYear / defaultSubject here keeps the initial
  // highlight aligned with the page-level defaults each open.
  useEffect(() => {
    if (open) {
      setStep(0);
      setYear(defaultYear);
      setPickedSubject(null);
    }
  }, [open, defaultYear, defaultSubject]);

  const handleYearPick = (value) => {
    setYear(value);
    setStep(1);
  };

  const handleSubjectPick = (value) => {
    setPickedSubject(value);
    onCreate({ year, subject: value });
  };

  return (
    <Modal
      open={open}
      title="Start a new tutoring session"
      footer={null}
      width={360}
      closable={!creating && !required}
      maskClosable={!creating && !required}
      keyboard={!required}
      onCancel={required ? undefined : onCancel}
      destroyOnHidden
    >
      {step === 0 ? (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Typography.Text type="secondary">What year are you in?</Typography.Text>
          {YEARS.map((y) => (
            <Button
              key={y}
              block
              size="large"
              type={year === y ? 'primary' : 'default'}
              onClick={() => handleYearPick(y)}
            >
              {`Year ${y.slice(1)}`}
            </Button>
          ))}
        </Space>
      ) : (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              type="link"
              disabled={creating}
              onClick={() => setStep(0)}
            >
              ← Back to Choose Year
            </Button>
          </div>
          <Typography.Text type="secondary">
            What subject do you want help with for <strong>{`Year ${year.slice(1)}`}</strong>?
          </Typography.Text>
          {SUBJECTS.map((s) => {
            const Icon = s.icon;
            const isPicked = pickedSubject === s.key;
            return (
              <Button
                key={s.key}
                block
                size="large"
                disabled={creating && !isPicked}
                loading={creating && isPicked}
                icon={<Icon style={{ color: s.color }} />}
                onClick={() => handleSubjectPick(s.key)}
              >
                {s.label}
              </Button>
            );
          })}
        </Space>
      )}
    </Modal>
  );
}

// Centered session picker in the top nav. Trigger and dropdown items
// share the same three-row layout (year/subject chips → title →
// created time + "X ago") so a glance at the closed Select tells the
// user the same thing as picking from the list.
function SessionSelect({ value, sessions, onChange }) {
  const loading = sessions === null;
  const [open, setOpen] = useState(false);
  const options = (sessions ?? []).map((s) => ({
    value: s.id,
    label: sessionDisplayTitle(s),
    session: s
  }));
  // Stretch the dropdown to fill the viewport below the trigger so the
  // user can see as many sessions as possible without scrolling. AntD's
  // default `listHeight` is 256px — far smaller than needed once a user
  // has accumulated a dozen-plus sessions.
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
        placeholder={loading ? 'Loading sessions…' : 'Pick a session'}
        style={{ width: '100%', maxWidth: 480 }}
        optionLabelProp="label"
        options={options}
        listHeight={listHeight}
        labelRender={({ value: id }) => {
          const s = (sessions ?? []).find((row) => row.id === id);
          if (!s) return null;
          return <SessionTriggerLabel session={s} />;
        }}
        optionRender={(option) => <SessionOptionContent session={option.data.session} />}
      />
    </>
  );
}

// Cap dropdown height at (viewport - 160px) for header chrome and a small
// gap below the dropdown. Each SessionOptionContent row renders at ~56px
// (two text lines + chip row + padding), so we also clamp to the natural
// height of the list to avoid an oversized empty pane when the user only
// has a few sessions.
const SESSION_OPTION_ROW_PX = 56;
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
  const natural = Math.max(1, optionCount) * SESSION_OPTION_ROW_PX + 8;
  return Math.min(max, natural);
}

// Closed-trigger label: single row of [title] [year chip] [subject chip],
// so the Select sits at AntD's default 32px height and matches the
// "+ New Session" button beside it. The dropdown rows still use the
// richer two-line SessionOptionContent layout.
function SessionTriggerLabel({ session }) {
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
        {sessionDisplayTitle(session)}
      </span>
      {session.year ? <HeaderYearChip year={session.year} /> : null}
      {session.subject ? <HeaderSubjectChip subject={session.subject} /> : null}
    </div>
  );
}

function SessionOptionContent({ session }) {
  const absolute = formatSessionDate(session.startedAt);
  const relative = formatSessionRelative(session.startedAt);
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
        {sessionDisplayTitle(session)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          {session.year ? <HeaderYearChip year={session.year} /> : null}
          {session.subject ? <HeaderSubjectChip subject={session.subject} /> : null}
        </div>
        {absolute ? (
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

function sessionDisplayTitle(session) {
  const title = typeof session?.title === 'string' ? session.title.trim() : '';
  if (title) return title.length > 80 ? `${title.slice(0, 77)}…` : title;
  const raw = typeof session?.preview === 'string' ? session.preview.trim() : '';
  if (!raw) return 'New Session';
  const flat = raw.replace(/\s+/g, ' ');
  return flat.length > 80 ? `${flat.slice(0, 77)}…` : flat;
}

function HeaderYearChip({ year }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 5px',
        border: `1px solid ${palette.border}`,
        borderRadius: 999,
        background: palette.bgPanel,
        color: palette.text,
        fontSize: 9,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap'
      }}
    >
      {year}
    </span>
  );
}

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

function formatSessionDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

function formatSessionRelative(iso) {
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
