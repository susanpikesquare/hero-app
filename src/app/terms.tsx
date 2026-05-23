import { LegalShell } from '@/components/legal-shell';
import { TERMS } from '@/lib/legal-content';

export default function TermsScreen() {
  return (
    <LegalShell
      title={TERMS.title}
      intro={TERMS.intro}
      sections={TERMS.sections}
    />
  );
}
