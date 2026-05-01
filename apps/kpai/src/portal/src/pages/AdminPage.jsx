import React, { useEffect, useState } from "react";
import { Table, Button, Space, Layout, Typography, message, Modal, Input, DatePicker, Form, Radio, Tag, Drawer, List, Spin } from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { colors, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { apiCall } from "../api";

const { Header, Content } = Layout;

export function AdminPage() {
  useEffect(() => { document.title = "Admin Dashboard"; }, []);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [sandboxes, setSandboxes] = useState([]);
  const [sandboxesLoading, setSandboxesLoading] = useState(false);

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

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddStudent = async () => {
    let values;
    try {
      values = await addForm.validateFields();
    } catch {
      return;
    }
    setAddLoading(true);
    const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`;
    const email = `${values.firstName.trim().toLowerCase()}.${values.lastName.trim().toLowerCase()}@student.code4kids`;
    try {
      await apiCall("/api/admin/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          displayName,
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
      title: "Student ID",
      dataIndex: "studentId",
      key: "studentId",
      render: (id) => (
        <Space size={4}>
          <span>{id}</span>
          <CopyOutlined
            style={{ color: colors.muted, cursor: "pointer", fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              message.success("Student ID copied");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Display Name",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Nickname",
      dataIndex: "nickname",
      key: "nickname",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
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
          <Logo />
          <span style={{ color: colors.muted, fontSize: 14 }}>
            Admin Dashboard
          </span>
        </div>
        <Space>
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
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
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
      </Content>
      <Drawer
        title={drawerStudent ? `${drawerStudent.displayName}'s Sandboxes` : "Sandboxes"}
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {sandboxesLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin />
          </div>
        ) : sandboxes.length === 0 ? (
          <Typography.Text type="secondary">No sandboxes yet.</Typography.Text>
        ) : (
          <List
            dataSource={sandboxes}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="open"
                    type="link"
                    size="small"
                    icon={<CodeOutlined />}
                    href={`/sandbox/${item.id}`}
                    target="_blank"
                  >
                    Open
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={item.title || "Untitled Sandbox"}
                  description={`Created ${new Date(item.createdAt).toLocaleString()} · Updated ${new Date(item.updatedAt).toLocaleString()}`}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
      <Modal
        title="Add Student"
        open={addModalOpen}
        onOk={handleAddStudent}
        onCancel={() => setAddModalOpen(false)}
        destroyOnClose
        confirmLoading={addLoading}
        okText="Submit"
      >
        <Form form={addForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} clearOnDestroy style={{ marginTop: 16 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "First Name is required" }]}>
            <Input
              onBlur={() => {
                if (!addForm.getFieldValue("nickname")) {
                  addForm.setFieldValue("nickname", addForm.getFieldValue("firstName"));
                }
              }}
            />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Last Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nickname" label="Nickname" rules={[{ required: true, message: "Nickname is required" }]}>
            <Input />
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
          <Form.Item name="homeAddress" label="Home Address">
            <Input />
          </Form.Item>
          <Form.Item name="contactNumber" label="Contact Number">
            <Input />
          </Form.Item>
          <Form.Item name="custodianName" label="Parent/Guardian">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
