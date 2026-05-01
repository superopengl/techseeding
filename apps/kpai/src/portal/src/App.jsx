import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { antTheme, antModalConfig } from "./theme";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SandboxPage } from "./pages/SandboxPage";
import { SandboxRedirectPage } from "./pages/SandboxRedirectPage";
import { AdminPage } from "./pages/AdminPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";

function RoleGuard({ role, children }) {
  const token = sessionStorage.getItem("c4k_token");
  const currentRole = sessionStorage.getItem("c4k_role");
  if (!token || currentRole !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <ConfigProvider theme={antTheme} modal={antModalConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sandbox" element={<RoleGuard role="student"><SandboxRedirectPage /></RoleGuard>} />
          <Route path="/sandbox/:sandboxId" element={<RoleGuard role="student"><SandboxPage /></RoleGuard>} />
          <Route path="/admin" element={<RoleGuard role="admin"><AdminPage /></RoleGuard>} />
          <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms_of_use" element={<TermsOfUsePage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
