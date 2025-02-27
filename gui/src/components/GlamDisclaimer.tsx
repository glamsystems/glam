import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function GlamDisclaimerContent() {
  return (
    <PageContentWrapper>
      <div className="w-2/3 mx-auto text-justify leading-loose text-sm text-muted-foreground">
        <h1 className="text-xl font-medium mb-6">GLAM Beta Disclaimer</h1>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p>
            We welcome you to{" "}
            <strong>
              GLAM's unaudited, experimental beta version, comprising GLAM
              Protocol, GLAM API, GLAM SDK, GLAM GUI, and any other related
              components (collectively "GLAM")
            </strong>
            . By accessing or using any component of GLAM, you acknowledge that
            you have read, understood, and agree to be bound by this disclaimer.
            If you do not agree, please refrain from using any GLAM components.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            2. Active Development Notice
          </h2>
          <p>
            GLAM is currently under <strong>active development</strong>.
            Features may change without notice, and{" "}
            <strong>breaking changes</strong> could occur. The software may not
            function as intended.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            3. Use at Your Own Risk
          </h2>
          <ul className="list-disc pl-6">
            <li>
              GLAM is provided on an "<strong>as is</strong>" and "
              <strong>as available</strong>" basis{" "}
              <strong>without warranties of any kind</strong>, either express or
              implied.
            </li>
            <li>
              <strong>You assume all risks</strong> associated with using GLAM.
            </li>
            <li>
              We <strong>strongly recommend</strong> not storing significant
              amounts of cryptoassets on the platform during the beta phase.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4. Risk Acknowledgment</h2>
          <ul className="list-disc pl-6">
            <li>
              <strong>Security Risks:</strong> The software may contain bugs,
              errors, or security vulnerabilities that could lead to
              unauthorized access, data breaches, or other security incidents.
            </li>
            <li>
              <strong>Financial Risks:</strong> There is a potential for{" "}
              <strong>partial or total loss of cryptoassets</strong> due to
              software issues or security breaches.
            </li>
            <li>
              <strong>Operational Risks:</strong> GLAM may experience
              interruptions, delays, or errors.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            5. Limitation of Liability
          </h2>
          <p>
            GLAM <strong>shall not be liable</strong> for any direct, indirect,
            incidental, consequential, or exemplary damages arising from the use
            or inability to use GLAM. This includes, but is not limited to, loss
            of cryptoassets, data loss, or security breaches.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6. No Warranties</h2>
          <p>
            GLAM makes <strong>no warranties or representations</strong> about
            the accuracy or completeness of GLAM's content or the content of any
            services linked to any GLAM component. We do not warrant that:
          </p>
          <ul className="list-disc pl-6">
            <li>GLAM will meet your requirements.</li>
            <li>GLAM will be uninterrupted, timely, secure, or error-free.</li>
            <li>Any errors or defects will be corrected.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7. User Responsibility</h2>
          <ul className="list-disc pl-6">
            <li>
              <strong>Security Measures:</strong> You are responsible for
              safeguarding your private keys, passwords, and any other security
              credentials. GLAM does not have access to your private keys or
              passwords.
            </li>
            <li>
              <strong>Due Diligence:</strong> Exercise caution and conduct your
              own due diligence before making any decisions based on the
              information provided by GLAM.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">8. Legal Jurisdiction</h2>
          <p>
            This disclaimer is governed by and construed in accordance with the
            laws of <strong>Switzerland</strong>. Any disputes arising out of or
            in connection with this disclaimer shall be subject to the exclusive
            jurisdiction of the courts of Switzerland.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">9. Contact Information</h2>
          <p>For inquiries or to report issues, please contact us at:</p>
          <ul className="list-disc pl-6">
            <li>
              <strong>Email:</strong> hello@glam.systems
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">10. Privacy Notice</h2>
          <p className="mb-2">
            GLAM may collect certain non-personal usage data to improve our
            services, perform bug fixes, and enhance user experience. This may
            include information such as:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Device Information:</strong> Type of device, operating
              system, browser type, and version.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, time
              and date of access, and other diagnostic data.
            </li>
            <li>
              <strong>Error Reports:</strong> Crash reports and performance data
              to help us identify and fix issues.
            </li>
          </ul>
          <p className="mb-2">
            We may utilize third-party analytics services such as Google
            Analytics, Umami, Mixpanel, or PostHog to collect and analyze this
            data.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Third-Party Services:</strong> These services may use
              cookies or similar tracking technologies to collect and analyze
              information about your use of GLAM. The data collected is
              generally aggregated and anonymized.
            </li>
          </ul>
          <p className="font-semibold mb-2">Personal Data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>
                No Collection of Personal Identifiable Information (PII):
              </strong>{" "}
              We do not collect or store any personal data that can be used to
              identify you without your explicit consent.
            </li>
          </ul>
          <p>
            A formal <strong>Privacy Policy</strong> detailing our data
            collection, use, and storage practices will be provided in future
            updates. By using GLAM, you consent to the collection and use of
            information as outlined above.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            11. Updates to This Disclaimer
          </h2>
          <p>
            We may update this disclaimer from time to time.{" "}
            <strong>Continued use</strong> of GLAM constitutes your acceptance
            of any changes. Please review this disclaimer periodically for
            updates.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            12. Nature of Information
          </h2>
          <ul className="list-disc pl-6 mb-4">
            <li>
              All content available through GLAM is{" "}
              <span className="font-semibold">general in nature</span> and{" "}
              <span className="font-semibold">
                not tailored to any particular person
              </span>
            </li>
            <li>
              Information is provided for{" "}
              <span className="font-semibold">informational purposes only</span>
            </li>
            <li>
              Content should{" "}
              <span className="font-semibold">
                not be considered investment advice
              </span>{" "}
              or a recommendation to transact in any cryptoassets
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-2">
            13. Informational Purposes</h2>
          <p className="mb-4">
            While GLAM provides information about cryptoassets and related
            technologies, users should not rely solely on this information for
            making investment decisions. We encourage users to conduct their own
            research and seek professional advice when necessary.
          </p>

          <h2 className="text-lg font-semibold mb-2">
            14. Performance Information
          </h2>
          <p className="mb-4">
            Any performance information or historical data presented through
            GLAM must be considered in conjunction with applicable disclosures.{" "}
            <span className="font-semibold">
              Past performance is not indicative of future results.
            </span>{" "}
            The cryptoasset market is highly volatile and unpredictable.
          </p>

          <h2 className="text-lg font-semibold mb-2">
            15. Third-Party Content
          </h2>
          <p className="mb-4">
            GLAM may include content from third-party sources. While we strive
            to provide accurate and up-to-date information, we do not endorse or
            guarantee the accuracy, completeness, or reliability of any
            third-party content. Users should exercise caution and critical
            thinking when interpreting such information.
          </p>

          <h2 className="text-lg font-semibold mb-2">
           16. Regulatory Compliance
          </h2>
          <p className="mb-4">
            Users are responsible for ensuring their use of GLAM complies with
            all applicable laws and regulations in their jurisdiction.
            Cryptoasset regulations vary by country and are subject to change.
            GLAM does not guarantee the legality of its services in all
            jurisdictions.
          </p>

          <h2 className="text-lg font-semibold mb-2">
           17. Professional Advice
          </h2>
          <p className="mb-4">
          Given the complex nature of cryptoassets and the potential risks
            involved, we strongly recommend that users consult with qualified
            professionals, including legal and tax advisors, before making any
            decisions based on the information provided by GLAM.
          </p>
        </section>
      </div>
    </PageContentWrapper>);
}
