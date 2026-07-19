import { useMemo } from 'react';
import { diffLines } from 'diff';
import { palette } from '../theme.js';

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
      rows.push({
        left: i < removed.length ? { no: (leftNo += 1), text: removed[i], type: 'del' } : null,
        right: i < added.length ? { no: (rightNo += 1), text: added[i], type: 'add' } : null
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
        {cell ? `${SIGN[cell.type]} ${cell.text}` : ''}
      </td>
    </>
  );
}

export default function SplitDiff({ oldText, newText, oldLabel, newLabel, height = 480 }) {
  const rows = useMemo(() => buildRows(oldText, newText), [oldText, newText]);
  const identical = useMemo(
    () => (oldText ?? '') === (newText ?? ''),
    [oldText, newText]
  );

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

  return (
    <div
      style={{
        border: `1px solid ${palette.borderSoft}`,
        borderRadius: 8,
        overflow: 'auto',
        height
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
          {identical ? (
            <tr>
              <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: palette.textMuted }}>
                No differences.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                <Side cell={row.left} />
                <Side cell={row.right} divider />
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
