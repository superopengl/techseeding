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
      <Logo size={24}/>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Snap or upload your worksheet
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 460, fontSize: 16, margin: 0 }}>
        Tap the <strong>+</strong> button below to add a photo or PDF of your worksheet,
        then ask a question to get started.
      </Typography.Paragraph>
    </div>
  );
}
