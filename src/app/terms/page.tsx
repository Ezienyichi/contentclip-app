import Link from 'next/link';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using VangelClip, you agree to these Terms of Service. You must be at least 18 years old or the age of majority in your jurisdiction to use this Service.',
  },
  {
    title: '2. Description of the Service',
    body: 'VangelClip processes uploaded videos and audio files, or links you provide, using artificial intelligence to produce short-form clips suited for platforms such as TikTok, Instagram Reels, and YouTube Shorts.',
  },
  {
    title: '3. Content Rights and User Responsibility',
    body: 'By uploading content, you represent and warrant that: (a) you own the content or hold all necessary rights, licences, and permissions to upload and process it; (b) your use of the Service does not infringe any third party\'s intellectual property, privacy, or other rights; and (c) the content does not violate any applicable law or regulation. You are solely responsible for all content you submit. Uploading content you do not own or have explicit permission to use — including copyrighted films, music recordings, television programmes, or other protected works — is strictly prohibited. You agree to indemnify and hold harmless VangelClip and its operators from any claims, damages, or expenses arising from your content or your breach of these Terms.',
  },
  {
    title: '4. Prohibited Uses',
    body: 'You agree not to: (a) upload content you lack the rights or permissions to use; (b) infringe any intellectual property rights; (c) upload unlawful, defamatory, harassing, or abusive material; (d) upload content that sexually exploits or harms minors; (e) reverse-engineer, decompile, or disassemble any part of the Service; (f) disrupt or interfere with the integrity or performance of the Service; or (g) resell, sublicence, or commercialise the Service without written permission from VangelClip.',
  },
  {
    title: '5. Copyright and DMCA Policy',
    body: 'If you believe content processed through VangelClip infringes your copyright, please send a written notice to adminvangelclip@gmail.com that includes: (1) a description of the copyrighted work claimed to be infringed; (2) identification of the infringing material and its location in the Service; (3) your contact information; (4) a good-faith statement that the use is not authorised by the rights holder; and (5) a statement under penalty of perjury that you are the copyright owner or authorised agent. VangelClip will remove infringing content promptly and terminate the accounts of repeat infringers.',
  },
  {
    title: '6. Accounts and Credits',
    body: 'You must provide accurate, current, and complete information when creating an account and keep your credentials secure. You are responsible for all activity under your account. The Service uses a credit system tied to subscription plans. Credits are consumed based on the duration of the source video or audio processed, regardless of the number of clips produced. Credits hold no cash value, are non-transferable, and unused credits do not roll over between billing periods.',
  },
  {
    title: '7. Payments and Refunds',
    body: 'Paid plans are billed in advance on a recurring basis. All fees are non-refundable except where required by applicable law. You may cancel your subscription at any time; your access will continue until the end of the current billing period. VangelClip reserves the right to change pricing with reasonable notice.',
  },
  {
    title: '8. Your Content and Storage',
    body: 'You retain ownership of all content you upload. You grant VangelClip a limited, non-exclusive, royalty-free licence to store, process, and display your content solely as necessary to provide the Service. Source files may be deleted after processing. Generated clips may be retained according to your plan tier. You are responsible for maintaining your own backups of original and generated files.',
  },
  {
    title: '9. Service Availability and AI Output',
    body: 'The Service is provided "as is" and "as available." We do not guarantee uninterrupted availability or error-free operation. AI-generated clip selections, captions, and descriptions may contain inaccuracies, omissions, or errors. VangelClip makes no guarantee of virality, reach, or any particular outcome. You should review all AI output before publishing.',
  },
  {
    title: '10. Limitation of Liability',
    body: 'To the maximum extent permitted by applicable law, VangelClip and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Service. Our total aggregate liability to you shall not exceed the greater of the fees you paid us in the twelve months preceding the claim or USD 100.',
  },
  {
    title: '11. Disclaimer of Warranties',
    body: 'VangelClip expressly disclaims all warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. No advice or information obtained from VangelClip shall create any warranty not expressly stated in these Terms.',
  },
  {
    title: '12. Termination',
    body: 'VangelClip may suspend or terminate your account at any time for violation of these Terms, with or without notice. Upon termination, your right to use the Service ceases immediately. The provisions relating to content responsibility, indemnification, limitation of liability, and governing law shall survive any termination.',
  },
  {
    title: '13. Changes to These Terms',
    body: 'VangelClip may update these Terms at any time. We will notify users of material changes through the Service interface or by updating the date at the top of this page. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.',
  },
  {
    title: '14. Governing Law',
    body: 'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, unless applicable law in your jurisdiction requires otherwise. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts of Nigeria.',
  },
  {
    title: '15. Contact',
    body: 'For questions about these Terms or to submit a copyright notice, contact us at adminvangelclip@gmail.com. We aim to respond within 2 business days.',
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: '#0d0021', color: '#e5e2f0', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,0,33,0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(124,58,237,0.18)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Vangel<span style={{ color: '#7c3aed' }}>Clip</span>
          </span>
        </Link>
        <Link href="/auth" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#ffffff', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
          Get Started
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        <p style={{ fontSize: 12, color: '#a78bfa', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#ffffff', marginBottom: 12, lineHeight: 1.15 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(167,139,250,0.7)', marginBottom: 48 }}>Last updated: June 17, 2026</p>

        {SECTIONS.map(s => (
          <div key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 10, borderLeft: '3px solid #7c3aed', paddingLeft: 14 }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(229,226,240,0.75)', lineHeight: 1.85, paddingLeft: 17 }}>
              {s.body}
            </p>
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(124,58,237,0.2)', paddingTop: 32, marginTop: 16 }}>
          <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(167,139,250,0.5)', marginBottom: 20 }}>
            This document is provided for convenience and does not constitute legal advice.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/legal/privacy" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/legal/cookies" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Cookie Policy</Link>
            <Link href="/auth" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Back to Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
