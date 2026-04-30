import React from "react";
import { Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const section = {
  marginBottom: 32,
};

const sectionTitle = {
  fontFamily: "'Baloo 2', cursive",
  color: "#2d3748",
  marginBottom: 8,
};

export function TermsOfUsePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          style={{ marginBottom: 24, color: "#43b88c", fontWeight: 600 }}
        >
          Back to Home
        </Button>

        <Title
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: 40,
            color: "#2d3748",
            marginBottom: 8,
          }}
        >
          Terms of Use
        </Title>
        <Text style={{ color: "#718096", fontSize: 14 }}>
          Last updated: 30 April 2026
        </Text>

        <div style={{ marginTop: 40 }}>
          <div style={section}>
            <Title level={3} style={sectionTitle}>
              1. Acceptance of Terms
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              By accessing or using Lab67 ("the Platform"), operated by
              Techseeding PTY LTD (ABN 35631597450 / ACN 631597450), you agree
              to be bound by these Terms of Use. If you are under 18, your
              parent or guardian must agree to these terms on your behalf. If you
              do not agree to these terms, please do not use the Platform.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              2. About Lab67
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Lab67 is an AI-powered game making platform designed for children
              aged 8–12. Students describe game ideas in natural language, and an
              AI assistant (powered by Claude from Anthropic) generates HTML, CSS,
              and JavaScript code to create playable browser games. The Platform
              is intended for educational and creative purposes.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              3. Account and Access
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Access to Lab67 requires administrator approval. To request
              access, students provide their first name and receive a one-time
              code upon approval. You agree to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>Provide accurate information when requesting access</li>
              <li>Not share your access credentials with others</li>
              <li>
                Not attempt to access another student's sandbox or session
              </li>
              <li>Notify an administrator if you suspect unauthorised access</li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We reserve the right to suspend or revoke access at any time and
              for any reason.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              4. Acceptable Use
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              When using Lab67, you agree not to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Use the Platform for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Attempt to bypass sandbox restrictions, access files outside your
                designated folder, or manipulate the AI to perform restricted
                actions
              </li>
              <li>
                Submit content that is harmful, abusive, threatening, obscene, or
                otherwise inappropriate for a children's platform
              </li>
              <li>
                Attempt to overload, disrupt, or interfere with the Platform or
                its infrastructure
              </li>
              <li>
                Use the AI assistant to generate content unrelated to game
                creation (e.g., homework, personal information gathering)
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract the source
                code of the Platform
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              5. AI-Generated Content
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Games and code created through Lab67 are generated by an AI
              assistant based on user prompts. You acknowledge that:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                AI-generated content may not always be accurate, complete, or
                free of errors
              </li>
              <li>
                The AI operates within a restricted sandbox and may not fulfil
                all requests
              </li>
              <li>
                We do not guarantee that generated games will work perfectly on
                all devices or browsers
              </li>
              <li>
                Administrators may review AI interactions for safety and quality
                assurance
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              6. Intellectual Property
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Platform:</strong> The Lab67 platform, its design,
              branding, and underlying technology are the property of Techseeding
              PTY LTD and are protected by intellectual property laws.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Student-Created Games:</strong> Games created by students
              using Lab67 are owned by the student (or their parent/guardian).
              However, by using the Platform you grant Techseeding PTY LTD a
              non-exclusive, royalty-free licence to store, display, and host
              your games as part of the service, and to showcase anonymised
              examples for promotional purposes.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              7. Privacy
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Your use of Lab67 is also governed by our{" "}
              <a
                href="/privacy_policy"
                style={{ color: "#43b88c", fontWeight: 600 }}
              >
                Privacy Policy
              </a>
              , which describes how we collect, use, and protect your
              information. By using the Platform, you consent to the practices
              described in the Privacy Policy.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              8. Disclaimers
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Lab67 is provided on an "as is" and "as available" basis. To the
              maximum extent permitted by Australian law, Techseeding PTY LTD
              disclaims all warranties, express or implied, including but not
              limited to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Fitness for a particular purpose or merchantability
              </li>
              <li>
                Uninterrupted or error-free operation of the Platform
              </li>
              <li>
                Accuracy or reliability of AI-generated content
              </li>
              <li>
                Security of data beyond our reasonable technical measures
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              9. Limitation of Liability
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              To the maximum extent permitted by law, Techseeding PTY LTD shall
              not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising out of or related to your use of
              Lab67. Our total liability for any claim arising from the use of
              the Platform shall not exceed the amount you have paid to us (if
              any) in the twelve months preceding the claim.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              10. Termination
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We may suspend or terminate your access to Lab67 at any time,
              with or without cause, and with or without notice. Upon
              termination, your right to use the Platform ceases immediately.
              Sandbox data and game files associated with your session may be
              deleted following termination.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              11. Governing Law
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              These Terms of Use are governed by and construed in accordance with
              the laws of Australia. Any disputes arising from these terms shall
              be subject to the exclusive jurisdiction of the courts of
              Australia.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              12. Changes to These Terms
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We may update these Terms of Use from time to time. Changes will
              be posted on this page with an updated "Last updated" date.
              Continued use of Lab67 after changes constitutes acceptance of the
              revised terms.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              13. Contact Us
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              If you have questions about these Terms of Use, please contact:
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Techseeding PTY LTD
              <br />
              ABN: 35631597450 / ACN: 631597450
              <br />
              Website: lab67.techseeding.com.au
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
