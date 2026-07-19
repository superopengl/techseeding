import { Typography } from 'antd';
import Logo from './Logo';

// Initial empty state shown when a session has no doc yet. The composer's
// `+` dropdown below is the single affordance for picking files — picks
// upload immediately and create a doc bubble, so this view is purely
// instructional copy.
export default function PhotoCapture() {
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
      <Logo height={32}/>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 460, fontSize: 16, margin: 0 }}>
        Tap the <strong>+</strong> button below to add a photo or PDF of your worksheet,
        or just type your question in the box. Then we'll work through it together, step by step.
      </Typography.Paragraph>
    </div>
  );
}
