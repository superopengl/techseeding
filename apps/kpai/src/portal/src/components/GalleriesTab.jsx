import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Input, Form, Tag, ColorPicker, message, Popconfirm, Typography, Avatar, Tooltip } from "antd";
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { colors, shadows, fonts } from "../theme";
import { apiCall } from "../api";
import { fgForHex } from "../utils/fgForHex";

const DEFAULT_COLOR = "#7c5cfc";

function colorToHex(value) {
  if (!value) return DEFAULT_COLOR;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  return DEFAULT_COLOR;
}

export function GalleriesTab() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/admin/galleries");
      setGalleries(data);
    } catch {
      message.error("Failed to load galleries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ name: "", notes: "", colorHex: DEFAULT_COLOR });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      notes: record.notes || "",
      colorHex: record.colorHex || DEFAULT_COLOR,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    const payload = {
      name: values.name.trim(),
      notes: values.notes?.trim() || null,
      colorHex: colorToHex(values.colorHex),
    };
    try {
      if (editing) {
        await apiCall(`/api/admin/gallery/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Gallery updated");
      } else {
        await apiCall("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Gallery created");
      }
      setModalOpen(false);
      fetchGalleries();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiCall(`/api/admin/gallery/${record.id}`, { method: "DELETE" });
      message.success("Gallery deleted");
      fetchGalleries();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: "Gallery",
      key: "gallery",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <Tag
          style={{
            background: record.colorHex,
            color: "#fff",
            border: "none",
            fontWeight: 600,
            borderRadius: 12,
            padding: "2px 12px",
          }}
        >
          {record.name}
        </Tag>
      ),
    },
    {
      title: "Color",
      dataIndex: "colorHex",
      key: "colorHex",
      render: (hex) => (
        <Space size={6}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: 4,
              background: hex,
              border: `1px solid ${colors.border}`,
              verticalAlign: "middle",
            }}
          />
          <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
            {hex}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Members",
      dataIndex: "members",
      key: "members",
      sorter: (a, b) => (a.members?.length || 0) - (b.members?.length || 0),
      render: (members) => {
        if (!members || members.length === 0) {
          return <span style={{ color: colors.muted }}>-</span>;
        }
        return (
          <Space size={6} wrap>
            {members.map((m) => {
              const fullName = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.userName;
              const initial = (fullName || "?").trim().charAt(0).toUpperCase();
              const bg = m.avatarColor || "#7c5cfc";
              return (
                <Tooltip key={m.userId} title={fullName}>
                  <Space size={4} align="center">
                    <Avatar
                      size={22}
                      style={{
                        background: bg,
                        color: fgForHex(bg),
                        fontFamily: fonts.heading,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {initial}
                    </Avatar>
                    <span style={{ fontSize: 12 }}>{m.userName}</span>
                  </Space>
                </Tooltip>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (v) => v || <span style={{ color: colors.muted }}>-</span>,
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Link to={`/gallery/${record.id}/expo`} target="_blank" rel="noopener noreferrer">
            <Button
              size="small"
              icon={<PictureOutlined />}
              style={{ borderRadius: 6 }}
            >
              Expo
            </Button>
          </Link>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            style={{ borderRadius: 6 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this gallery?"
            description={
              (record.members?.length || 0) > 0
                ? `${record.members.length} student${record.members.length === 1 ? "" : "s"} will be removed from this gallery.`
                : "This action cannot be undone."
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ borderRadius: 8 }}
        >
          Add Gallery
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchGalleries}
          style={{ borderRadius: 8 }}
        >
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={galleries}
        rowKey="id"
        loading={loading}
        pagination={false}
        style={{
          background: colors.surface,
          borderRadius: 16,
          boxShadow: shadows.cardSubtle,
        }}
      />
      <Modal
        title={editing ? "Edit Gallery" : "Add Gallery"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editing ? "Save" : "Create"}
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} clearOnDestroy style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Name is required" },
              { max: 50, message: "Name must be 50 characters or less" },
            ]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="colorHex"
            label="Color"
            getValueFromEvent={(value) => colorToHex(value)}
          >
            <ColorPicker showText format="hex" disabledAlpha />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
            rules={[{ max: 2000, message: "Notes must be 2000 characters or less" }]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
