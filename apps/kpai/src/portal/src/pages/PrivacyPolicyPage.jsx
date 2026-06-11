import React, { useEffect } from "react";
import { Typography } from "antd";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { setPageTitle } from "../utils/setPageTitle";

const { Title, Paragraph, Text } = Typography;

const section = {
  marginBottom: 32,
};

const sectionTitle = {
  fontFamily: "'Baloo 2', cursive",
  color: "#2d3748",
  marginBottom: 8,
};

export function PrivacyPolicyPage() {
  useEffect(() => {
    setPageTitle(
      "Privacy Policy — KidPlayAI",
      "How KidPlayAI collects, uses, and protects information about kids and parents who use our AI craft maker platform.",
    );
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/"><Logo size={56} style={{ marginInline: "auto" }} /></Link>
        </div>

        <Title
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: 40,
            color: "#2d3748",
            marginBottom: 8,
          }}
        >
          Privacy Policy
        </Title>
        <Text style={{ color: "#718096", fontSize: 14 }}>
          Last updated: 4 May 2026
        </Text>

        <div style={{ marginTop: 40 }}>
          <div style={section}>
            <Title level={3} style={sectionTitle}>
              1. Introduction
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI ("we", "us", or "our") is an AI-powered craft making platform
              for children aged 8–12, operated by Techseeding PTY LTD (ABN
              35631597450 / ACN 631597450). We are committed to protecting the
              privacy of all users, especially children. This Privacy Policy
              explains how we collect, use, and safeguard information when you
              use our platform at kidplayai.techseeding.com.au.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              2. Information We Collect
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Account Information:</strong> When a student requests
              access, we collect their first name and date of birth. These
              details are used only to identify the student inside the
              Platform — to greet them, tell different students apart, and
              let a teacher recognise them in a class — and not for any legal
              verification, age compliance, or external identity-checking
              purpose.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Because name and date of birth are collected for in-platform
              identification only, a nickname, preferred name, or approximate
              date of birth is perfectly acceptable. If a student or their
              parent/guardian chooses to provide a real legal name or accurate
              date of birth, they do so voluntarily and at their own risk. By
              registering for KidPlayAI, the student (or their parent/guardian
              on their behalf) is deemed to accept that Techseeding PTY LTD
              has no special obligation to treat voluntarily provided real
              data differently from any other identification data, and
              accepts no responsibility for any disclosure of such data
              through any channel beyond the reasonable security measures
              described in this policy.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Session Data:</strong> We store session identifiers and
              sandbox activity (messages sent to the AI assistant and generated
              craft code) to provide the service. Messages are associated with a
              session ID, not with any personally identifiable information beyond
              the student's first name.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Technical Data:</strong> We may collect standard server
              logs including IP addresses, browser type, and access timestamps
              for security and operational purposes.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              3. How We Use Information
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We use collected information solely to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>Provide and operate the KidPlayAI craft-making platform</li>
              <li>
                Manage student sessions and sandbox environments
              </li>
              <li>
                Enable the AI assistant to help students create crafts
              </li>
              <li>
                Administer access through our approval system
              </li>
              <li>
                Maintain security and prevent misuse of the platform
              </li>
              <li>
                Communicate directly with the user about their account,
                login approval, security notices, or important service
                updates
              </li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Personally identifiable information (PII)</strong> —
              such as a student's name, date of birth, or any contact details
              voluntarily shared by a parent or guardian — is used solely for
              in-platform identification and direct communication with the
              user. We do not run analytics, profiling, modelling, or any
              other data-processing pipeline on PII; we do not derive
              secondary datasets from it; we do not use it for advertising or
              marketing; and we do not disclose it to any third party, except
              as strictly necessary to deliver the service (see Section 5) or
              as required by law.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              4. AI Interaction and Content
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI uses an open-source AI coding agent (OpenCode) backed
              by the DeepSeek language model to help students create crafts.
              Messages sent by students to the AI assistant are processed to
              generate craft code. These interactions are stored as part of the
              sandbox session and may be reviewed by administrators for safety
              and quality purposes. The AI operates within a restricted sandbox
              environment with limited tool access for security.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              5. Data Sharing
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We do not sell, trade, or rent personal information. We may share
              data with:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                <strong>DeepSeek:</strong> Messages are sent to the DeepSeek
                API (via the OpenCode agent) to power the AI assistant,
                subject to DeepSeek's privacy policies
              </li>
              <li>
                <strong>Hosting Providers:</strong> Our infrastructure providers
                process data as necessary to deliver the service
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information
                if required by law or to protect the safety of our users
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              6. Children's Privacy
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI is designed for children aged 8–12. We take children's
              privacy seriously:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                We collect only the minimum information necessary (a first name)
              </li>
              <li>
                All student access requires administrator approval
              </li>
              <li>
                We do not require children to provide email addresses or other
                personal contact information
              </li>
              <li>
                Student-created crafts and interactions are contained within
                isolated sandbox environments
              </li>
              <li>
                Parents or guardians may contact us at any time to request
                deletion of their child's data
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              7. User-Created Crafts and Content Rights
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Crafts and code created on KidPlayAI by a student, with
              assistance from our AI tools and our staff, belong to the
              student as the original author of the underlying idea. By
              using the Platform, the student (or their parent/guardian on
              their behalf) grants Techseeding PTY LTD a perpetual,
              worldwide, royalty-free, non-exclusive licence to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Store, host, share, demonstrate, modify, and publish the
                craft and its underlying code, in whole or in part, for any
                purpose related to operating, promoting, or improving
                KidPlayAI
              </li>
              <li>
                Do so without attributing the author by name
              </li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Students retain the right to download or copy their own crafts
              at any time on request. The licence granted above survives any
              termination of the user's account: even after a student stops
              using KidPlayAI, Techseeding PTY LTD may continue to use,
              share, demonstrate, modify, and publish the crafts created
              during the student's time on the Platform on the same terms
              set out above.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              8. Data Retention
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Session data and sandbox content are retained for the duration of
              the student's active use of the platform. Inactive sessions and
              associated data may be deleted periodically. You may request
              deletion of data at any time by contacting us.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              9. Security
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We implement appropriate technical and organisational measures to
              protect information, including:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Isolated sandbox environments per student with restricted file
                system access
              </li>
              <li>
                AI tool usage restricted to safe, predefined operations
              </li>
              <li>JWT-based authentication for API access</li>
              <li>Administrator-controlled access approval</li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              10. Your Rights
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Under the Australian Privacy Act 1988, you have the right to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Access the personal information we hold about you or your child
              </li>
              <li>
                Request correction of inaccurate information
              </li>
              <li>Request deletion of personal data</li>
              <li>
                Lodge a complaint with the Office of the Australian Information
                Commissioner (OAIC)
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              11. Changes to This Policy
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated "Last updated" date.
              Continued use of KidPlayAI after changes constitutes acceptance of the
              updated policy.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              12. Contact Us
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              If you have questions about this Privacy Policy or wish to
              exercise your rights, please contact:
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Techseeding PTY LTD
              <br />
              ABN: 35631597450 / ACN: 631597450
              <br />
              Website: https://kidplayai.techseeding.com.au
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
