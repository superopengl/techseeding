import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { diffLines, diffWords } from 'diff';
import { palette } from '../theme.js';

const { Text } = Typography;
const TOOLBAR_H = 40; // change-count + prev/next bar above the diff

// GitHub-style split (side-by-side) line diff. Left = old text, right = new.
// Removed lines are red on the left, added lines green on the right, and
// unchanged lines sit on both sides. Built from a jsdiff line diff so there's
// no React-version peer-dependency baggage from a third-party viewer.

// Turn jsdiff parts into aligned {left, right} rows. Consecutive removed/added
// runs are zipped position-by-position so a modified line lines up with its
// replacement; leftover lines on either side become one-sided rows.
function buildRows(oldText, newText) {
  const parts = diffLines(oldText ?? '', newText ?? '');
  const rows = [];
  let leftNo = 0;
  let rightNo = 0;
  let removed = [];
  let added = [];

  const flush = () => {
    const n = Math.max(removed.length, added.length);
    for (let i = 0; i < n; i += 1) {
      const rem = i < removed.length ? removed[i] : null;
      const add = i < added.length ? added[i] : null;
      // When a line was modified (paired removal + addition), run a word diff
      // so the panes can highlight exactly which words changed. Pure add-only
      // or del-only lines get no segments (the whole line is highlighted).
      let leftSegs = null;
      let rightSegs = null;
      if (rem != null && add != null) {
        const parts = diffWords(rem, add);
        leftSegs = parts
          .filter((p) => !p.added)
          .map((p) => ({ text: p.value, changed: !!p.removed }));
        rightSegs = parts
          .filter((p) => !p.removed)
          .map((p) => ({ text: p.value, changed: !!p.added }));
      }
      rows.push({
        left: rem != null ? { no: (leftNo += 1), text: rem, type: 'del', segs: leftSegs } : null,
        right: add != null ? { no: (rightNo += 1), text: add, type: 'add', segs: rightSegs } : null
      });
    }
    removed = [];
    added = [];
  };

  for (const part of parts) {
    const lines = part.value.split('\n');
    // diffLines chunks end with a trailing newline → drop the empty tail.
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (part.added) {
      added.push(...lines);
    } else if (part.removed) {
      removed.push(...lines);
    } else {
      flush();
      for (const line of lines) {
        rows.push({
          left: { no: (leftNo += 1), text: line, type: 'ctx' },
          right: { no: (rightNo += 1), text: line, type: 'ctx' }
        });
      }
    }
  }
  flush();
  return rows;
}

const BG = { add: '#e6ffec', del: '#ffebe9', ctx: 'transparent', empty: '#f6f8fa' };
const GUTTER_BG = { add: '#ccffd8', del: '#ffd7d5', ctx: 'transparent', empty: '#f6f8fa' };
// Darker per-word highlight painted over the line background for the exact
// words that changed within a modified line.
const WORD_BG = { add: '#abf2bc', del: '#f8b5b8' };
const SIGN = { add: '+', del: '-', ctx: ' ' };

const cellStyle = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: '18px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  padding: '0 8px 0 4px',
  verticalAlign: 'top'
};
const gutterStyle = {
  ...cellStyle,
  width: 1,
  textAlign: 'right',
  color: palette.textMuted,
  userSelect: 'none',
  padding: '0 8px',
  whiteSpace: 'nowrap'
};

function Side({ cell, divider }) {
  const type = cell?.type ?? 'empty';
  const leftBorder = divider ? { borderLeft: `1px solid ${palette.borderSoft}` } : null;
  return (
    <>
      <td style={{ ...gutterStyle, ...leftBorder, background: GUTTER_BG[type] }}>
        {cell?.no ?? ''}
      </td>
      <td style={{ ...cellStyle, background: BG[type] }}>
        {cell ? (
          <>
            {`${SIGN[cell.type]} `}
            {cell.segs
              ? cell.segs.map((s, i) => (
                  <span
                    key={i}
                    style={s.changed ? { background: WORD_BG[cell.type], borderRadius: 2 } : undefined}
                  >
                    {s.text}
                  </span>
                ))
              : cell.text}
          </>
        ) : (
          ''
        )}
      </td>
    </>
  );
}

export default function SplitDiff({ oldText, newText, oldLabel, newLabel, height = 480 }) {
  const rows = useMemo(() => buildRows(oldText, newText), [oldText, newText]);

  // Row indices where each contiguous changed section (hunk) begins. A row is
  // "changed" when either side isn't a context line.
  const hunkStarts = useMemo(() => {
    const starts = [];
    let inHunk = false;
    rows.forEach((row, i) => {
      const changed =
        (row.left && row.left.type !== 'ctx') || (row.right && row.right.type !== 'ctx');
      if (changed && !inHunk) starts.push(i);
      inHunk = changed;
    });
    return starts;
  }, [rows]);
  const startToHunk = useMemo(
    () => new Map(hunkStarts.map((rowIdx, h) => [rowIdx, h])),
    [hunkStarts]
  );

  const containerRef = useRef(null);
  const hunkRefs = useRef([]);
  const [pos, setPos] = useState(0);

  // Reset the pointer whenever the compared content changes.
  useEffect(() => {
    setPos(0);
  }, [oldText, newText]);

  const scrollToHunk = (idx) => {
    const el = hunkRefs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;
    // Scroll only the diff container (not the page), clearing the sticky header.
    container.scrollTop += el.getBoundingClientRect().top - container.getBoundingClientRect().top - 56;
  };

  const go = (delta) => {
    if (!hunkStarts.length) return;
    const idx = Math.min(hunkStarts.length - 1, Math.max(0, pos + delta));
    setPos(idx);
    scrollToHunk(idx);
  };

  const headerCell = {
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: palette.textInkSoft ?? undefined,
    background: '#f6f8fa',
    borderBottom: `1px solid ${palette.borderSoft}`,
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const changeCount = hunkStarts.length;

  return (
    <div>
      <div
        style={{
          height: TOOLBAR_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <Text style={{ fontSize: 12, color: palette.textMuted }}>
          {changeCount === 0
            ? 'No changes'
            : `${changeCount} change${changeCount === 1 ? '' : 's'}${
                changeCount ? ` · ${Math.min(pos + 1, changeCount)}/${changeCount}` : ''
              }`}
        </Text>
        <Space size={4}>
          <Button
            size="small"
            icon={<UpOutlined />}
            disabled={changeCount === 0 || pos <= 0}
            onClick={() => go(-1)}
          >
            Prev
          </Button>
          <Button
            size="small"
            icon={<DownOutlined />}
            disabled={changeCount === 0 || pos >= changeCount - 1}
            onClick={() => go(1)}
          >
            Next
          </Button>
        </Space>
      </div>
      <div
        ref={containerRef}
        style={{
          border: `1px solid ${palette.borderSoft}`,
          borderRadius: 8,
          overflow: 'auto',
          height: Math.max(0, height - TOOLBAR_H)
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: '50%' }} />
            <col style={{ width: 44 }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={2} style={{ ...headerCell, textAlign: 'left' }}>
                {oldLabel || 'Previous'}
              </th>
              <th
                colSpan={2}
                style={{ ...headerCell, textAlign: 'left', borderLeft: `1px solid ${palette.borderSoft}` }}
              >
                {newLabel || 'Current'}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: palette.textMuted }}>
                  No content.
                </td>
              </tr>
            ) : (
              // Always render the full content side by side — unchanged lines
              // included — so the panes show the prompt even when identical.
              rows.map((row, i) => {
                const h = startToHunk.get(i);
                return (
                  <tr
                    key={i}
                    ref={
                      h != null
                        ? (el) => {
                            hunkRefs.current[h] = el;
                          }
                        : undefined
                    }
                  >
                    <Side cell={row.left} />
                    <Side cell={row.right} divider />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
