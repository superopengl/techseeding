import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import { antTheme, antModalConfig } from "./theme";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SandboxPage } from "./pages/SandboxPage";
import { SandboxRedirectPage } from "./pages/SandboxRedirectPage";
import { AdminPage } from "./pages/AdminPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";

export function App() {
  return (
    <ConfigProvider theme={antTheme} modal={antModalConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sandbox" element={<SandboxRedirectPage />} />
          <Route path="/sandbox/:sandboxId" element={<SandboxPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms_of_use" element={<TermsOfUsePage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
