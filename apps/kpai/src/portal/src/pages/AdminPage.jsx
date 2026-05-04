import React, { useEffect, useState } from "react";
import { setPageTitle } from "../utils/setPageTitle";
import { Table, Button, Space, Layout, Typography, message, Modal, Input, DatePicker, Form, Radio, Tag, Drawer, Spin, Tabs, Badge } from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { colors, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { SandboxReviewDrawer } from "../components/SandboxReviewDrawer";
import { apiCall } from "../api";

const { Header, Content } = Layout;

export function AdminPage() {
  useEffect(() => { setPageTitle("Admin Dashboard"); }, []);
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);
  const [addSubmittable, setAddSubmittable] = useState(false);
  const addFormValues = Form.useWatch([], addForm);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [sandboxes, setSandboxes] = useState([]);
  const [sandboxesLoading, setSandboxesLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSandbox, setReviewSandbox] = useState(null);
  const [markingReadIds, setMarkingReadIds] = useState(() => new Set());

  useEffect(() => {
    const { accountName, firstName, lastName } = addFormValues || {};
    if (!accountName || !firstName || !lastName) {
      setAddSubmittable(false);
      return;
    }
    addForm.validateFields({ validateOnly: true }).then(
      () => setAddSubmittable(true),
      () => setAddSubmittable(false),
    );
  }, [addFormValues, addForm]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/admin/students");
      setStudents(data);
    } catch {
      message.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnquiries = async () => {
    setEnquiriesLoading(true);
    try {
      const data = await apiCall("/api/admin/enquiries");
      setEnquiries(data);
    } catch {
      message.error("Failed to load enquiries");
    } finally {
      setEnquiriesLoading(false);
    }
  };

  const handleMarkEnquiryRead = async (id) => {
    setMarkingReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      const updated = await apiCall(`/api/admin/enquiries/${id}/read`, { method: "POST" });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (e) {
      message.error(e.message || "Failed to mark as read");
    } finally {
      setMarkingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (activeTab === "students") fetchStudents();
    else if (activeTab === "enquiries") fetchEnquiries();
  }, [activeTab]);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const token = sessionStorage.getItem("kpai_token");
      if (!token) return;
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}/api/ws/admin?token=${token}`);
      ws.onmessage = (e) => {
        try {
          const { type } = JSON.parse(e.data);
          if (type === "login_request_changed") fetchStudents();
          else if (type === "enquiry_created") fetchEnquiries();
        } catch { /* ignore malformed frames */ }
      };
      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        try { ws.close(); } catch { /* already closing */ }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      try { ws?.close(); } catch { /* already closed */ }
    };
  }, []);

  const handleAddStudent = async () => {
    let values;
    try {
      values = await addForm.validateFields();
    } catch {
      return;
    }
    setAddLoading(true);
    const userName = `${values.firstName.trim()} ${values.lastName.trim()}`;
    const email = `${values.firstName.trim().toLowerCase()}.${values.lastName.trim().toLowerCase()}@student.kidplayai`;
    try {
      await apiCall("/api/admin/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          userName,
          email,
          dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        }),
      });
      message.success("Student added");
      setAddModalOpen(false);
      fetchStudents();
    } catch (e) {
      message.error(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleApproveLogin = async (loginRequestId) => {
    try {
      await apiCall("/api/admin/login/student/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginRequestId }),
      });
      message.success("Login approved");
      fetchStudents();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleRowClick = async (record) => {
    setDrawerStudent(record);
    setDrawerOpen(true);
    setSandboxesLoading(true);
    try {
      const data = await apiCall(`/api/admin/students/${record.id}/sandboxes`);
      setSandboxes(data);
    } catch {
      message.error("Failed to load sandboxes");
      setSandboxes([]);
    } finally {
      setSandboxesLoading(false);
    }
  };

  const columns = [
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
      sorter: (a, b) => (a.userName || "").localeCompare(b.userName || ""),
      render: (id) => (
        <Space size={4}>
          <span>{id}</span>
          <CopyOutlined
            style={{ color: colors.muted, cursor: "pointer", fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              message.success("Username copied");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Name",
      key: "name",
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Phone",
      dataIndex: "contactNumber",
      key: "contactNumber",
      sorter: (a, b) => (a.contactNumber || "").localeCompare(b.contactNumber || ""),
      render: (v) => v || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      render: (v) => v || "-",
    },
    {
      title: "Joined At",
      dataIndex: "joinedAt",
      key: "joinedAt",
      render: (t) => (t ? new Date(t).toLocaleString() : "-"),
      sorter: (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Login Status",
      dataIndex: "loginRequestStatus",
      key: "loginRequestStatus",
      render: (status) => {
        if (!status) return <Tag>-</Tag>;
        const colorMap = { requesting: "orange", approved: "green", loggedin: "blue" };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          {record.loginRequestStatus === "requesting" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => { e.stopPropagation(); handleApproveLogin(record.loginRequestId); }}
              style={{ borderRadius: 6 }}
            >
              Approve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const enquiryColumns = [
    {
      title: "Contact Name",
      dataIndex: "contactName",
      key: "contactName",
      sorter: (a, b) => a.contactName.localeCompare(b.contactName),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      sorter: (a, b) => a.method.localeCompare(b.method),
      render: (v) => (
        <Space size={4}>
          <span>{v}</span>
          <CopyOutlined
            style={{ color: colors.muted, cursor: "pointer", fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(v);
              message.success("Method copied");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Child Age",
      dataIndex: "childAge",
      key: "childAge",
      sorter: (a, b) => {
        const order = { "<8": 0, "8": 1, "9": 2, "10": 3, "11": 4, "12": 5, "12+": 6 };
        const av = a.childAge in order ? order[a.childAge] : -1;
        const bv = b.childAge in order ? order[b.childAge] : -1;
        return av - bv;
      },
      render: (v) => {
        if (!v) return "-";
        const colorMap = {
          "<8": "#e53e3e",
          "8": "#f56565",
          "9": "#f59e0b",
          "10": "#ecc94b",
          "11": "#84cc16",
          "12": "#43b88c",
          "12+": "#15803d",
        };
        return (
          <Tag
            style={{
              background: colorMap[v] || colors.muted,
              color: colors.onDark,
              border: "none",
              fontWeight: 600,
              borderRadius: 12,
              padding: "2px 10px",
            }}
          >
            {v}
          </Tag>
        );
      },
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (v) => (
        <Typography.Paragraph
          style={{ marginBottom: 0, maxWidth: 480, whiteSpace: "pre-wrap", color: "inherit" }}
          ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
        >
          {v}
        </Typography.Paragraph>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (t) => (t ? new Date(t).toLocaleString() : "-"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Read At",
      dataIndex: "readAt",
      key: "readAt",
      render: (t, record) => {
        if (t) return new Date(t).toLocaleString();
        return (
          <Button
            icon={<CheckOutlined />}
            loading={markingReadIds.has(record.id)}
            onClick={() => handleMarkEnquiryRead(record.id)}
            aria-label="Mark as read"
            title="Mark as read"
            style={{ borderRadius: 8 }}
          />
        );
      },
      sorter: (a, b) => {
        const av = a.readAt ? new Date(a.readAt).getTime() : 0;
        const bv = b.readAt ? new Date(b.readAt).getTime() : 0;
        return av - bv;
      },
    },
  ];

  const unreadEnquiryCount = enquiries.filter((e) => !e.readAt).length;
  const pendingApprovalCount = students.filter((s) => s.loginRequestStatus === "requesting").length;

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          height: 56,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link to="/" aria-label="Go to homepage" style={{ display: "inline-flex", alignItems: "center" }}>
            <Logo size={36} square />
          </Link>
          <span style={{ color: colors.muted, fontSize: 14 }}>
            Admin Dashboard
          </span>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs
          activeKey={activeTab}
          type="card"
          onChange={setActiveTab}
          items={[
            {
              key: "students",
              label: (
                <Space size={8}>
                  <span>Students</span>
                  {pendingApprovalCount > 0 && (
                    <Badge count={pendingApprovalCount} style={{ backgroundColor: colors.primary }} />
                  )}
                </Space>
              ),
              children: (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setAddModalOpen(true)}
                      style={{ borderRadius: 8 }}
                    >
                      Add Student
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchStudents}
                      style={{ borderRadius: 8 }}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={students}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    onRow={(record) => ({
                      onClick: () => handleRowClick(record),
                      style: { cursor: "pointer" },
                    })}
                    style={{
                      background: colors.surface,
                      borderRadius: 16,
                      boxShadow: shadows.cardSubtle,
                    }}
                  />
                </>
              ),
            },
            {
              key: "enquiries",
              label: (
                <Space size={8}>
                  <span>Enquiries</span>
                  {unreadEnquiryCount > 0 && <Badge count={unreadEnquiryCount} />}
                </Space>
              ),
              children: (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchEnquiries}
                      style={{ borderRadius: 8 }}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Table
                    columns={enquiryColumns}
                    dataSource={enquiries}
                    rowKey="id"
                    loading={enquiriesLoading}
                    pagination={false}
                    onRow={(record) => ({
                      style: record.readAt
                        ? { color: colors.muted }
                        : { color: colors.heading, fontWeight: 700 },
                    })}
                    style={{
                      background: colors.surface,
                      borderRadius: 16,
                      boxShadow: shadows.cardSubtle,
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Content>
      <Drawer
        title={drawerStudent ? `${drawerStudent.firstName} ${drawerStudent.lastName}'s Sandboxes` : "Sandboxes"}
        placement="right"
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
      >
        {sandboxesLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin />
          </div>
        ) : sandboxes.length === 0 ? (
          <Typography.Text type="secondary">No sandboxes yet.</Typography.Text>
        ) : (
          <div>
            {sandboxes.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: colors.heading }}>{item.title || "Untitled Sandbox"}</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Created {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: colors.accentBlue }}>Request: <b>{Number(item.totalRequestLength || 0).toLocaleString()}</b></span>
                    {" · "}
                    <span style={{ color: colors.accentPurple }}>Response: <b>{Number(item.totalResponseLength || 0).toLocaleString()}</b></span>
                    {" · "}
                    <span style={{ color: colors.accentAmber }}>Total: <b>{(Number(item.totalRequestLength || 0) + Number(item.totalResponseLength || 0)).toLocaleString()}</b></span>
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<CodeOutlined />}
                  onClick={() => {
                    setReviewSandbox(item);
                    setReviewOpen(true);
                  }}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </Drawer>
      <SandboxReviewDrawer
        open={reviewOpen}
        sandboxId={reviewSandbox?.id}
        sandboxTitle={reviewSandbox?.title || "Untitled Sandbox"}
        studentName={drawerStudent ? `${drawerStudent.firstName} ${drawerStudent.lastName}` : undefined}
        onClose={() => setReviewOpen(false)}
      />
      <Modal
        title="Add Student"
        open={addModalOpen}
        onOk={handleAddStudent}
        onCancel={() => setAddModalOpen(false)}
        destroyOnHidden
        confirmLoading={addLoading}
        okText="Submit"
        okButtonProps={{ disabled: !addSubmittable }}
      >
        <Form form={addForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} clearOnDestroy style={{ marginTop: 16 }}>
          <Form.Item
            name="accountName"
            label="Username"
            rules={[
              { required: true, message: "Username is required" },
              { max: 50, message: "Username must be 50 characters or less" },
              { pattern: /^[a-zA-Z0-9_/]+$/, message: "Only letters, digits, underscore, and slash are allowed" },
              {
                validator: async (_, value) => {
                  if (!value || !/^[a-zA-Z0-9_/]+$/.test(value)) return;
                  const result = await apiCall("/api/admin/check-user-name", { method: "POST", body: JSON.stringify({ userName: value }), headers: { "Content-Type": "application/json" } });
                  if (!result.available) throw new Error("Username is already taken");
                },
              },
            ]}
            validateTrigger="onBlur"
          >
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "First Name is required" }, { max: 50, message: "First Name must be 50 characters or less" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Last Name is required" }, { max: 50, message: "Last Name must be 50 characters or less" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: "100%" }} defaultPickerValue={dayjs().subtract(10, "year")} />
          </Form.Item>
          <Form.Item name="gender" label="Gender">
            <Radio.Group>
              <Radio value="boy">Boy</Radio>
              <Radio value="girl">Girl</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="homeAddress" label="Home Address" rules={[{ max: 100, message: "Home Address must be 100 characters or less" }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="contactNumber" label="Contact Number" rules={[{ max: 20, message: "Contact Number must be 20 characters or less" }]}>
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="custodianName" label="Parent/Guardian" rules={[{ max: 50, message: "Parent/Guardian must be 50 characters or less" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="notes" label="Notes" rules={[{ max: 2000, message: "Notes must be 2000 characters or less" }]}>
            <Input.TextArea rows={2} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
