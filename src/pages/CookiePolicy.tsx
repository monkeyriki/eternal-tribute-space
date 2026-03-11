import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy – Eternal Memory</title>
        <meta name="description" content="Eternal Memory cookie policy." />
      </Helmet>
      <Layout>
        <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h1 className="mb-8 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            Cookie Policy
          </h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. What Are Cookies</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They are used to improve the browsing experience and provide essential functionality.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Cookies Used</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left text-foreground">Type</th>
                      <th className="px-4 py-2 text-left text-foreground">Purpose</th>
                      <th className="px-4 py-2 text-left text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-medium">Technical (required)</td>
                      <td className="px-4 py-2">Authentication, user session, site preferences</td>
                      <td className="px-4 py-2">Session / 1 year</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-medium">Analytics</td>
                      <td className="px-4 py-2">Anonymous usage statistics to improve the service</td>
                      <td className="px-4 py-2">2 years</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-medium">Advertising</td>
                      <td className="px-4 py-2">Google AdSense to show relevant ads (Free plan only)</td>
                      <td className="px-4 py-2">Variable</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. Managing Cookies</h2>
              <p>You can manage cookie preferences through your browser settings. Disabling certain cookies may limit some site functionality.</p>
              <p>Google AdSense advertising cookies are automatically disabled for Premium or Business plan users.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Supabase:</strong> authentication cookies to manage user sessions</li>
                <li><strong>Stripe:</strong> cookies required for secure payment processing</li>
                <li><strong>Google AdSense:</strong> cookies for ad personalization (Free plan only)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. Consent</h2>
              <p>By continuing to browse our site, you accept the use of required technical cookies. For analytics and advertising cookies, we require your explicit consent in accordance with GDPR and the ePrivacy Directive.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. Contact</h2>
              <p>For information about cookies, contact us via the site's Contact page.</p>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CookiePolicy;
