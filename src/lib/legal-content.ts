/**
 * Privacy Policy + Terms of Service content.
 *
 * IMPORTANT: This was drafted by AI as a starting point. It is NOT legal
 * advice and has not been reviewed by counsel. Susan must replace this
 * with a version reviewed by a lawyer before onboarding real customers,
 * especially because the app collects data from minors (COPPA / state-law
 * implications).
 *
 * Structured so the legal pages render from a single source — Susan or
 * counsel can edit text here and both pages update.
 */

export const EFFECTIVE_DATE = 'May 24, 2026';
export const COMPANY_NAME = 'Home Hero';
export const CONTACT_EMAIL = 'susan@pikesquare.co';

export const REVIEW_BANNER =
  'This page is a working draft prepared as a starting point. It has not been reviewed by legal counsel and is not legal advice. Before opening Home Hero to real customers, the operator must replace this content with a version reviewed by a qualified attorney familiar with COPPA and applicable state privacy law.';

type Section = { heading: string; paragraphs: string[] };

type LegalPage = {
  slug: string;
  title: string;
  intro: string[];
  sections: Section[];
};

export const PRIVACY: LegalPage = {
  slug: 'privacy',
  title: 'Privacy Policy',
  intro: [
    `${COMPANY_NAME} is a family chore app built for households with children. We take seriously the trust parents place in us when they share information about themselves and their kids. This Privacy Policy explains what we collect, how we use it, who we share it with, and the choices available to families.`,
    `By creating a ${COMPANY_NAME} account, you confirm that you are at least 18 years old and that you are the parent or legal guardian of any children whose information you provide.`,
  ],
  sections: [
    {
      heading: 'Information we collect from parents',
      paragraphs: [
        'When you create an account, we collect your email address, the password you set, and the name you choose for your family.',
        'When you use the app, we record the chores you create, the settings you choose, and the decisions you make about your child’s submissions (approve, override, etc.). We also record the device and browser metadata necessary to operate the service securely.',
      ],
    },
    {
      heading: 'Information we collect about children',
      paragraphs: [
        'We collect a child’s first name (or chosen display name) and age, both entered by a parent. We do not request, encourage, or store a child’s last name, address, school, phone number, or email.',
        'When a child submits a chore photo from a parent-supervised device, we store that photo in a private cloud storage bucket scoped to the family. We pair each submission with a timestamp and the chore it was submitted for.',
        'If parents have provided a verified reference photo for a chore, we send both the reference image and the child’s submitted image to our AI processing partner (currently OpenAI) for the limited purpose of returning a kid-friendly review and a pass/needs-work verdict.',
      ],
    },
    {
      heading: 'How we use information',
      paragraphs: [
        'We use the information collected to: operate the service, validate chore submissions, deliver rewards and progress information to families, communicate with parents about their account, secure the service against fraud and abuse, and improve our product over time.',
        'We do not sell personal information. We do not use a child’s data for advertising. We do not allow third-party advertising trackers in the app.',
      ],
    },
    {
      heading: 'Children’s data and parental consent',
      paragraphs: [
        `${COMPANY_NAME} is designed to be used by families. Children do not create their own accounts; parents create the family account and authorize each child’s participation by adding them as a family member.`,
        'When a parent generates a kid join code so a child can use the app on their own device, the parent is providing the verifiable consent required for that child’s use of the service. The child’s session is linked to the family the parent created.',
        'Parents may review the information we hold about their children, request corrections, or delete a child’s account at any time from the dashboard. Deleting a child removes their personal information, chore history, and submitted photos from active systems within a commercially reasonable time (backups are retained for the periods described under "Data retention").',
        'We will never knowingly collect personal information directly from a child outside the scope of a parent’s account, beyond what the parent has authorized.',
      ],
    },
    {
      heading: 'Service providers we share with',
      paragraphs: [
        `${COMPANY_NAME} uses a small number of carefully chosen service providers to operate the platform:`,
        '• Supabase, for database, authentication, and file storage. Data is encrypted in transit and at rest.',
        '• Vercel, for web hosting and edge delivery of our marketing site and web app.',
        '• OpenAI, for the photo comparison and kid-friendly feedback that drives chore review. We share only the images necessary for a single evaluation and do not use the feedback for any other purpose.',
        '• Apple, for distribution of our iOS app through the App Store and TestFlight.',
        'Each provider is bound by contractual obligations to use the data only to deliver their service to us. We do not sell or rent personal information to any third party.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'We use industry-standard practices to protect personal information, including encryption in transit (HTTPS), encryption at rest in our cloud database and storage, row-level access controls scoped to each family, and access logging on our service providers.',
        'No system is perfectly secure. If we become aware of an incident that materially affects a family’s data, we will notify affected accounts in accordance with applicable law.',
      ],
    },
    {
      heading: 'Your rights and choices',
      paragraphs: [
        `As a parent on ${COMPANY_NAME}, you can: view, edit, or delete your family’s information from the dashboard; request a copy of the personal information we hold; ask us to correct inaccurate information; or close your account entirely. To exercise any of these rights, contact us at ${CONTACT_EMAIL}.`,
        'Depending on where you live, you may have additional rights under laws such as the California Consumer Privacy Act, COPPA, the GDPR, or similar frameworks. We honor all such rights to the extent applicable.',
      ],
    },
    {
      heading: 'Data retention',
      paragraphs: [
        'We retain personal information for as long as the family’s account is active and for a short period afterward to allow account recovery. When a family is deleted, we remove personal information from active systems within 30 days. Backups containing personal information are rotated out within 90 days.',
        'We may retain anonymized or aggregate information (with no link to any individual) for product improvement purposes.',
      ],
    },
    {
      heading: 'International users',
      paragraphs: [
        `${COMPANY_NAME} is operated from the United States. If you use the service from another jurisdiction, you understand that information may be transferred to and processed in the United States, where data protection laws may differ from those in your jurisdiction.`,
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the updated version here with a new effective date. For material changes, we will notify the parent on the account before the changes take effect.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Questions, requests, or concerns about this Privacy Policy can be sent to ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};

export const TERMS: LegalPage = {
  slug: 'terms',
  title: 'Terms of Service',
  intro: [
    `These Terms of Service ("Terms") govern your use of the ${COMPANY_NAME} service, including the website, web app, and iOS app. By creating an account or otherwise using ${COMPANY_NAME}, you agree to these Terms.`,
    `If you do not agree to these Terms, do not use ${COMPANY_NAME}.`,
  ],
  sections: [
    {
      heading: 'Eligibility',
      paragraphs: [
        `You must be at least 18 years old to create a ${COMPANY_NAME} account. You must be the parent or legal guardian of any children whose information you provide or whom you authorize to use the service.`,
        'If you are creating an account on behalf of an organization, you confirm that you are authorized to bind that organization to these Terms.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You are responsible for maintaining the confidentiality of your account credentials. Notify us promptly at the contact address below if you believe your account has been compromised.',
        'You are responsible for all activity that occurs under your account, including activity by children you have authorized.',
      ],
    },
    {
      heading: 'Children using the service',
      paragraphs: [
        `${COMPANY_NAME} is designed to be used by families. The parent or legal guardian creates the family account and authorizes each child’s participation by adding them and, if applicable, generating a kid join code for their device.`,
        'You confirm that you are responsible for your child’s use of the service, that you have explained the service to your child in an age-appropriate way, and that you will supervise their use consistent with your family’s judgment.',
        `${COMPANY_NAME} does not knowingly enter into a direct relationship with a child. The parent is the account holder and the entity with whom we contract.`,
      ],
    },
    {
      heading: 'Content you submit',
      paragraphs: [
        `You retain ownership of any content you or your children submit through ${COMPANY_NAME}, including photos. By submitting content, you grant ${COMPANY_NAME} a limited, non-exclusive, royalty-free license to host, store, transmit, and display that content as necessary to operate the service for your family.`,
        'You confirm that any content submitted does not violate any third party’s rights and complies with the acceptable-use rules below.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        `You agree not to use ${COMPANY_NAME} to: violate any law or regulation; harass, intimidate, or harm any person; upload content that depicts or could endanger a child; circumvent or attempt to defeat the security of the service; reverse-engineer the software except to the extent expressly permitted by law; or use the service to develop a competing product.`,
        'We reserve the right to suspend or terminate accounts that we reasonably believe are violating these rules.',
      ],
    },
    {
      heading: 'AI photo validation',
      paragraphs: [
        `${COMPANY_NAME} includes a feature that uses third-party AI to compare a child’s submitted chore photo to a reference photo and return a kid-friendly review. The AI verdict is informational and is intended to be one input into a parent’s judgment, not a substitute for it. You confirm that you understand AI can make mistakes and that final responsibility for evaluating a child’s work rests with the parent.`,
      ],
    },
    {
      heading: 'Beta and changes to the service',
      paragraphs: [
        `${COMPANY_NAME} is under active development. We may add, change, or remove features at any time. We may also stop offering the service entirely with reasonable notice.`,
        'Some features may be labeled "beta" or similar; those features may be less stable than the rest of the service.',
      ],
    },
    {
      heading: 'Pricing',
      paragraphs: [
        'During the founding family period, the service is provided at no charge. We may introduce paid tiers in the future and will give clear notice before any paid feature begins.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        `You may close your account at any time by contacting us at ${CONTACT_EMAIL} or deleting your account from settings. We may suspend or terminate your account if we reasonably believe you have violated these Terms, if we are required to do so by law, or if we discontinue the service.`,
        'On termination, your right to use the service ends. Sections of these Terms that by their nature should survive termination (including the disclaimer, limitation of liability, and governing-law sections) will survive.',
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        `${COMPANY_NAME} is provided "as is" and "as available," without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the service will be uninterrupted or error-free.`,
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        `To the maximum extent permitted by law, ${COMPANY_NAME} and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising out of or in connection with your use of the service.`,
        `In no event will our total liability to you for all claims relating to the service exceed the greater of (a) the amount you paid ${COMPANY_NAME} in the twelve months prior to the claim, or (b) $50 USD.`,
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These Terms are governed by the laws of the State of California, excluding its conflict-of-laws rules. Any dispute arising out of or relating to these Terms will be brought exclusively in the state or federal courts located in California.',
      ],
    },
    {
      heading: 'Changes to these Terms',
      paragraphs: [
        'We may update these Terms from time to time. We will post the updated version here with a new effective date. For material changes, we will notify the parent on the account before the changes take effect. Your continued use of the service after a change indicates acceptance of the updated Terms.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Questions about these Terms can be sent to ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};
