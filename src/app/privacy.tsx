import { LegalShell } from '@/components/legal-shell';
import { PRIVACY } from '@/lib/legal-content';

export default function PrivacyScreen() {
  return (
    <LegalShell
      title={PRIVACY.title}
      intro={PRIVACY.intro}
      sections={PRIVACY.sections}
    />
  );
}
