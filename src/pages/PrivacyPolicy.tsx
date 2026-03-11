import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy – Eternal Memory</title>
        <meta name="description" content="Eternal Memory privacy policy. How we collect, use, and protect your personal data." />
      </Helmet>
      <Layout>
        <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h1 className="mb-8 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            Privacy Policy
          </h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. Data Controller</h2>
              <p>Eternal Memory ("we", "our", "Platform") is the data controller for personal data collected through the website. We are committed to protecting our users' privacy in compliance with the General Data Protection Regulation (GDPR – EU Regulation 2016/679) and the California Consumer Privacy Act (CCPA).</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Data Collected</h2>
              <p>We collect the following categories of personal data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Registration data:</strong> name, email address, password (encrypted)</li>
                <li><strong>Memorial data:</strong> names, dates, locations, photos, videos, biographies of commemorated individuals</li>
                <li><strong>Payment data:</strong> processed securely via Stripe. We do not store credit card data</li>
                <li><strong>Browsing data:</strong> IP address, browser type, pages visited, technical cookies</li>
                <li><strong>User contributions:</strong> guestbook messages, virtual tributes</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. Purpose of Processing</h2>
              <p>We use personal data to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and manage the digital memorial service</li>
                <li>Process payments for virtual tributes and premium subscriptions</li>
                <li>Send notifications related to accounts and memorials</li>
                <li>Moderate content to ensure community respect</li>
                <li>Improve the service through aggregated and anonymized analytics</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. Legal Basis</h2>
              <p>Data processing is based on: user consent, performance of the service contract, legitimate interest of the controller, and legal obligations.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
              <p>We do not sell personal data. We share data only with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Supabase:</strong> database hosting and authentication</li>
                <li><strong>Stripe:</strong> payment processing</li>
                <li><strong>Google AdSense:</strong> advertising (Free plan users only, with option to disable via upgrade)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. User Rights (GDPR/CCPA)</h2>
              <p>You have specific rights regarding your personal data. Depending on your jurisdiction (including the EU/EEA under GDPR and California under CCPA), these may include:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Right of access:</strong> you can request confirmation whether we process your personal data and receive a copy of the data associated with your account and memorials. You can initiate this from the account settings page using the "Export my data" feature or by contacting us directly.
                </li>
                <li>
                  <strong>Right to rectification:</strong> you can correct inaccurate or incomplete data at any time by editing your profile, memorials, or by contacting us if you cannot make the change yourself.
                </li>
                <li>
                  <strong>Right to erasure ("right to be forgotten"):</strong> you can permanently delete your account and all associated data (memorials, tributes, profile data) using the "Delete Account" option in your settings. Once confirmed, we schedule deletion of your data within 30 days, except where retention is required by law.
                </li>
                <li>
                  <strong>Right to data portability:</strong> you can obtain your personal data in a structured, commonly used and machine‑readable format via the "Export my data" feature. This allows you to reuse your data with another service.
                </li>
                <li>
                  <strong>Right to object to processing:</strong> you may object to certain types of processing, including direct marketing or non‑essential analytics. Where applicable, we will stop processing unless we demonstrate compelling legitimate grounds or legal obligations.
                </li>
                <li>
                  <strong>Right to restrict processing and withdraw consent:</strong> you may request temporary limitation of processing in specific circumstances and withdraw any consent you have previously given, without affecting the lawfulness of processing before withdrawal.
                </li>
              </ul>
              <p className="mt-2">
                For California residents (CCPA): you also have the right to know what categories of personal information we collect, the purposes for which we use it, request access or deletion of your information, and not be discriminated against for exercising your privacy rights.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
              <p>
                Personal data is retained for as long as your account is active and for a limited period thereafter where required for legal, accounting, or fraud‑prevention purposes.
              </p>
              <p className="mt-2">
                When you delete your account using the "Delete Account" feature, we mark your profile and associated memorials and tributes for removal and delete them from our active systems within
                <strong> 30 days</strong>, except where longer retention is mandated by applicable law (for example, for tax or financial reporting related to completed payments).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">8. Security</h2>
              <p>We implement appropriate technical and organizational measures, including data encryption in transit (TLS), Row Level Security at the database level, and secure authentication.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">9. Contact</h2>
              <p>
                To exercise your rights, make a privacy request, or ask questions about this policy, you can contact us at:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Email:</strong> privacy@eternalmemory.app
                </li>
              </ul>
              <p className="mt-2">
                Please include enough information for us to identify your account (for example, the email address you used to register) and clearly indicate which rights you wish to exercise. We will
                respond as required by applicable law.
              </p>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PrivacyPolicy;
