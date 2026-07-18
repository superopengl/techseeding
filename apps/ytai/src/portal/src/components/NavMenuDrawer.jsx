import { Avatar, Drawer, Menu, Modal, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authSession from '../lib/authSession.js';
import { palette } from '../theme.js';

// Shared left-rail menu surfaced from the MenuOutlined button in the top
// nav on both TutorPage and ReportsPage. Keeps the user avatar footer +
// nav items + sign-out confirm in one place so the two pages can't drift
// apart.
export default function NavMenuDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [modal, modalContextHolder] = Modal.useModal();
  const currentUser = authSession().user;

  return (
    <>
      {modalContextHolder}
      <Drawer
        placement="left"
        open={open}
        onClose={onClose}
        size={280}
        title="YouTutorAI"
        styles={{
          body: { padding: 0, display: 'flex', flexDirection: 'column' },
          footer: { padding: 16 }
        }}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              src={
                currentUser?.picture
                  ? <img src={currentUser.picture} alt="" referrerPolicy="no-referrer" />
                  : undefined
              }
              icon={<UserOutlined />}
              style={{ backgroundColor: palette.subjects.math.color }}
            />
            <Typography.Text strong>{currentUser?.name || 'Guest'}</Typography.Text>
          </div>
        }
      >
        <Menu
          mode="inline"
          selectable={false}
          style={{ border: 'none', flex: 1 }}
          onClick={({ key }) => {
            if (key === '/') return; // handled by the anchor below
            if (key === 'logout') {
              modal.confirm({
                title: 'Sign out?',
                content: "You'll be signed out of YouTutorAI.",
                okText: 'Sign out',
                okButtonProps: { danger: true },
                cancelText: 'Cancel',
                onOk: () => {
                  onClose?.();
                  authSession().clear();
                  navigate('/');
                }
              });
              return;
            }
            onClose?.();
            navigate(key);
          }}
          items={[
            {
              key: '/',
              label: (
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onClose?.()}
                  style={{ display: 'block', color: 'inherit' }}
                >
                  Home
                </a>
              )
            },
            { key: '/tutor', label: 'Tutor Sessions' },
            { key: '/reports', label: 'Analysis Reports' },
            { type: 'divider' },
            {
              key: 'logout',
              label: <span style={{ color: palette.error }}>Sign out</span>
            }
          ]}
        />
      </Drawer>
    </>
  );
}
