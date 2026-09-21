import { useMutation, type MutationState } from './useMutation'
import { notifyError } from '@/lib/swal'

/**
 * `useMutation` variant that surfaces every failure through the SweetAlert2
 * error popup (DEC-038) before reporting failure to the caller. Successful
 * results pass through unchanged; pages pair this with `notifySuccess` on
 * completion.
 */
export function useAlertMutation<TInput, TResult>(
  mutate: (input: TInput) => Promise<TResult>,
  failureTitle: string,
): MutationState<TInput, TResult> {
  return useMutation(async (input: TInput) => {
    try {
      return await mutate(input)
    } catch (cause) {
      await notifyError(failureTitle, cause instanceof Error ? cause.message : undefined)
      throw cause
    }
  })
}
