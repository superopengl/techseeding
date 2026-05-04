import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { antTheme, antModalConfig } from "./theme";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

const SandboxPage = lazy(() =>
  import("./pages/SandboxPage").then((m) => ({ default: m.SandboxPage }))
);
const SandboxRedirectPage = lazy(() =>
  import("./pages/SandboxRedirectPage").then((m) => ({ default: m.SandboxRedirectPage }))
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import("./pages/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfUsePage = lazy(() =>
  import("./pages/TermsOfUsePage").then((m) => ({ default: m.TermsOfUsePage }))
);
const LogoPage = lazy(() =>
  import("./pages/LogoPage").then((m) => ({ default: m.LogoPage }))
);

function RoleGuard({ role, children }) {
  const token = sessionStorage.getItem("kpai_token");
  const currentRole = sessionStorage.getItem("kpai_role");
  if (!token || currentRole !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <ConfigProvider theme={antTheme} modal={antModalConfig}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sandbox" element={<RoleGuard role="student"><SandboxRedirectPage /></RoleGuard>} />
            <Route path="/sandbox/:sandboxId" element={<RoleGuard role="student"><SandboxPage /></RoleGuard>} />
            <Route path="/admin" element={<RoleGuard role="admin"><AdminPage /></RoleGuard>} />
            <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms_of_use" element={<TermsOfUsePage />} />
            <Route path="/logo" element={<LogoPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}
