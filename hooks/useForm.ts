import { useRef, useCallback, useState } from "react";
import { TextInput } from "react-native";
import type { BaseSchema, BaseIssue } from "valibot";
import { safeParse } from "valibot";

type FieldValues = Record<string, any>;
type FieldName<T> = keyof T & string;
type FormErrors<T> = Partial<Record<keyof T, string>>;

export type RegisterReturn = {
  ref: React.RefCallback<TextInput>;
  onChangeText: (text: string) => void;
  onBlur: () => void;
};

interface UseFormOptions<T extends FieldValues> {
  schema?: BaseSchema<unknown, T, BaseIssue<unknown>>;
  defaultValues?: Partial<T>;
  mode?: "onBlur" | "onChange" | "onSubmit";
}

// ─── Module-level pure helper ─────────────────────────────────────────────────
// Valibot path segments are objects { key, ... } — not plain strings like Zod.
function extractIssueMap<T extends FieldValues>(
  issues: BaseIssue<unknown>[],
): FormErrors<T> {
  const next: FormErrors<T> = {};
  for (const issue of issues) {
    const key = (issue.path?.[0] as any)?.key as FieldName<T> | undefined;
    if (key && !next[key]) {
      next[key] = issue.message;
    }
  }
  return next;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useForm<T extends FieldValues>({
  schema,
  defaultValues = {},
  mode = "onBlur",
}: UseFormOptions<T>) {
  // ── All mutable state lives in refs to avoid re-render cascades ───────────
  const inputRefs = useRef<Partial<Record<FieldName<T>, TextInput | null>>>({});
  const valuesRef = useRef<Partial<T>>({ ...defaultValues });
  const touchedRef = useRef<Partial<Record<FieldName<T>, boolean>>>({});
  const errorsRef = useRef<FormErrors<T>>({});
  const schemaRef = useRef(schema);
  const modeRef = useRef(mode);
  const defaultsRef = useRef(defaultValues);

  // Sync every render — cheap, keeps stable callbacks always reading fresh values.
  schemaRef.current = schema;
  modeRef.current = mode;
  defaultsRef.current = defaultValues;

  // ── Reactive state (only what the UI actually needs to re-render for) ─────
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const syncErrors = useCallback((next: FormErrors<T>) => {
    errorsRef.current = next;
    setErrors(next);
  }, []);

  // ── validateAll ───────────────────────────────────────────────────────────
  // Defined with useCallback so stableSubmit (below) can safely close over it.
  const validateAll = useCallback((): FormErrors<T> => {
    if (!schemaRef.current) return {};
    const result = safeParse(schemaRef.current, valuesRef.current);
    if (result.success) {
      syncErrors({});
      return {};
    }
    const next = extractIssueMap<T>(result.issues);
    syncErrors(next);
    return next;
  }, [syncErrors]);

  // ── validateField ─────────────────────────────────────────────────────────
  const validateField = useCallback((name: FieldName<T>): string | null => {
    if (!schemaRef.current) return null;
    const result = safeParse(schemaRef.current, valuesRef.current);
    if (result.success) return null;
    const issue = result.issues.find((i) => (i.path?.[0] as any)?.key === name);
    return issue?.message ?? null;
  }, []);

  // ── register ──────────────────────────────────────────────────────────────
  // Handlers cached per-field in a ref — always same object identity.
  const fieldHandlersRef = useRef<
    Partial<Record<FieldName<T>, RegisterReturn>>
  >({});

  const register = useCallback(
    (name: FieldName<T>): RegisterReturn => {
      if (fieldHandlersRef.current[name]) {
        return fieldHandlersRef.current[name]!;
      }
      const handler: RegisterReturn = {
        ref: (instance) => {
          inputRefs.current[name] = instance;
        },
        onChangeText: (text) => {
          (valuesRef.current as any)[name] = text;
          if (modeRef.current === "onChange" && touchedRef.current[name]) {
            const error = validateField(name);
            const next = { ...errorsRef.current };
            if (error) next[name] = error;
            else delete next[name];
            syncErrors(next);
          }
        },
        onBlur: () => {
          touchedRef.current[name] = true;
          if (modeRef.current === "onSubmit") return;
          const error = validateField(name);
          const next = { ...errorsRef.current };
          if (error) next[name] = error;
          else delete next[name];
          syncErrors(next);
        },
      };
      fieldHandlersRef.current[name] = handler;
      return handler;
    },
    [validateField, syncErrors],
  );

  // ── setValue ──────────────────────────────────────────────────────────────
  const setValue = useCallback(
    (name: FieldName<T>, value: any) => {
      (valuesRef.current as any)[name] = value;
      const input = inputRefs.current[name];
      if (input) {
        const str =
          typeof value === "string"
            ? value
            : value == null
              ? ""
              : String(value);
        input.setNativeProps({ text: str });
      }
      bump();
    },
    [bump],
  );

  // ── watch ─────────────────────────────────────────────────────────────────
  const watch = useCallback(
    <K extends FieldName<T>>(name: K): T[K] => (valuesRef.current as any)[name],
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── getValues ─────────────────────────────────────────────────────────────
  const getValues = useCallback((): T => ({ ...valuesRef.current }) as T, []);

  // ── setFocus ──────────────────────────────────────────────────────────────
  const setFocus = useCallback((name: FieldName<T>) => {
    inputRefs.current[name]?.focus();
  }, []);

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(
    (next?: Partial<T>) => {
      const values = next ?? defaultsRef.current;
      valuesRef.current = { ...values };
      touchedRef.current = {};
      syncErrors({});
      for (const key of Object.keys(inputRefs.current)) {
        const k = key as FieldName<T>;
        const v = (values as any)[k];
        const str = typeof v === "string" ? v : v == null ? "" : String(v);
        inputRefs.current[k]?.setNativeProps({ text: str });
      }
      bump();
    },
    [syncErrors, bump],
  );

  // ── handleSubmit ──────────────────────────────────────────────────────────
  // KEY FIX: stableSubmit must NOT close over validateAll at init time via
  // useRef(fn).current — that fn runs once and freezes the closure.
  // Instead we store validateAll in a ref and read it at call time.
  //
  // Similarly onValid/onInvalid are stored in refs so handleSubmit() can be
  // called in JSX on every render without producing a new onPress reference.
  const validateAllRef = useRef(validateAll);
  validateAllRef.current = validateAll; // always latest

  const onValidRef = useRef<((data: T) => void) | null>(null);
  const onInvalidRef = useRef<((errs: FormErrors<T>) => void) | undefined>(
    undefined,
  );

  // Created once at mount. Reads everything through refs at call time.
  const stableSubmit = useRef<() => void>(null as any);
  if (stableSubmit.current === null) {
    stableSubmit.current = () => {
      const errs = validateAllRef.current();
      if (Object.keys(errs).length > 0) {
        const first = Object.keys(errs)[0] as FieldName<T>;
        inputRefs.current[first]?.focus();
        onInvalidRef.current?.(errs);
        return;
      }
      onValidRef.current?.(valuesRef.current as T);
    };
  }

  const handleSubmit = useCallback(
    (onValid: (data: T) => void, onInvalid?: (errs: FormErrors<T>) => void) => {
      onValidRef.current = onValid;
      onInvalidRef.current = onInvalid;
      return stableSubmit.current;
    },
    // stableSubmit.current never changes — [] is correct
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    register,
    handleSubmit,
    errors,
    setValue,
    getValues,
    setFocus,
    reset,
    validateAll,
    watch,
  };
}
