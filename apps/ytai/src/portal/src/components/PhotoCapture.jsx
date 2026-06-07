import { Button, Typography } from 'antd';
import { CloseOutlined, FilePdfOutlined } from '@ant-design/icons';
import { palette } from '../theme.js';

// PDF thumbnail uses a peach tint + warm orange icon — the writing-subject
// color reads as "document" without competing with chat blues.
const PDF_TINT = palette.tint.secondary;
const PDF_ICON = palette.subjects.writing.color;

// Initial-upload empty state shown when a session has no doc yet.
// Controlled component: queued pages live in the parent (ChatPanel) and
// are added via the composer's `+` dropdown below — that's the single
// affordance for picking files, so this view is intentionally button-free
// and just shows the queued thumbnails (if any) plus instructional copy.
//
// Props:
//   pages           — [{ file, isPdf, previewUrl }] currently queued
//   onRemovePage(idx) — drop a queued page by index
export default function PhotoCapture({ pages = [], onRemovePage }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        textAlign: 'center'
      }}
    >
      <Typography.Title level={2} style={{ margin: 0 }}>
        Snap or upload your worksheet
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 460, fontSize: 16, margin: 0 }}>
        Tap the <strong>+</strong> button below to add a photo or PDF of your worksheet,
        then type a question and hit Send — your worksheet will go with it.
      </Typography.Paragraph>

      {pages.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 720
          }}
        >
          {pages.map((p, idx) => (
            <PageThumb
              key={`${idx}-${p.file.name}`}
              index={idx + 1}
              src={p.previewUrl}
              isPdf={p.isPdf}
              name={p.file.name}
              onRemove={() => onRemovePage?.(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PageThumb({ index, src, isPdf, name, onRemove }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 120,
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
        background: palette.surface
      }}
      title={name}
    >
      {isPdf ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: PDF_TINT,
            color: PDF_ICON,
            textAlign: 'center',
            padding: 8
          }}
        >
          <FilePdfOutlined style={{ fontSize: 36 }} />
          <span style={{ fontSize: 11, lineHeight: 1.2, wordBreak: 'break-word' }}>{name}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={`page ${index}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: 6,
          background: palette.overlay.scrim,
          color: palette.surface,
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600
        }}
      >
        {index}
      </div>
      <Button
        size="small"
        type="primary"
        danger
        shape="circle"
        icon={<CloseOutlined />}
        onClick={onRemove}
        style={{ position: 'absolute', right: 4, top: 4, width: 22, height: 22, minWidth: 22 }}
        aria-label={`Remove page ${index}`}
      />
    </div>
  );
}
