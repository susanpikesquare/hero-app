/**
 * Parent override mutations as a reusable hook.
 *
 * Used by the submission detail page (/app/submissions/[id]) and the iOS
 * parent queue (`/app` on iOS). Both call the same SECURITY DEFINER RPCs
 * — this hook just gives them a consistent busy / error pattern.
 */

import { useState } from 'react';

import type { Database } from './database.types';
import { supabase } from './supabase';

type OverrideKind = Database['public']['Enums']['override_kind'];
type OverrideReason = Database['public']['Enums']['override_reason'];

export function useOverride() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Apply a parent decision to a submission. `kind` = approved | rejected;
   * `reason` must be present for approvals and null for rejections.
   */
  const apply = async (
    submissionId: string,
    kind: OverrideKind,
    reason: OverrideReason | null
  ): Promise<boolean> => {
    setError(null);
    setBusy(true);
    try {
      const { error: rpcErr } = await supabase.rpc('apply_parent_override', {
        p_submission_id: submissionId,
        p_override: kind,
        p_reason: reason,
      });
      if (rpcErr) throw rpcErr;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your decision.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  /** Undo a previously applied decision. */
  const clear = async (submissionId: string): Promise<boolean> => {
    setError(null);
    setBusy(true);
    try {
      const { error: rpcErr } = await supabase.rpc('clear_parent_override', {
        p_submission_id: submissionId,
      });
      if (rpcErr) throw rpcErr;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear your decision.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { apply, clear, busy, error };
}
