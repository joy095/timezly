import { useRef, useCallback, useState } from "react";
import { TextInput } from "react-native";
import { ZodType, ZodError } from "zod";

type FieldValues = Record<string, any>;
type FieldName<T> = keyof T;
type FormErrors<T> = Partial<Record<keyof T, string>>;

type RegisterReturn = {
  ref: React.RefCallback<TextInput>;
  onChangeText: (text: string) => void;
  onBlur: () => void;
};

interface UseFormOptions<T extends FieldValues> {
  schema?: ZodType<T>;
  defaultValues?: Partial<T>;
  mode?: "onBlur" | "onChange" | "onSubmit";
}

export function useForm<T extends FieldValues>({
  schema,
  defaultValues = {},
  mode = "onBlur",
}: UseFormOptions<T>) {
  const inputRefs = useRef<Partial<Record<FieldName<T>, TextInput | null>>>({});
  const valuesRef = useRef<Partial<T>>({ ...defaultValues });
  const touchedRef = useRef<Partial<Record<FieldName<T>, boolean>>>({});
  const errorsRef = useRef<FormErrors<T>>({});

  // Keep latest schema/mode in refs so stable callbacks can read them
  const schemaRef = useRef(schema);
  const modeRef = useRef(mode);
  schemaRef.current = schema;
  modeRef.current = mode;

  const [errors, setErrors] = useState<FormErrors<T>>({});

  const syncErrors = useCallback((next: FormErrors<T>) => {
    errorsRef.current = next;
    setErrors(next);
  }, []);

  // ================= ZOD VALIDATION =================

  const validateAll = useCallback((): FormErrors<T> => {
    if (!schemaRef.current) return {};
    try {
      schemaRef.current.parse(valuesRef.current);
      syncErrors({});
      return {};
    } catch (err) {
      const zodErr = err as ZodError;
      const next: FormErrors<T> = {};
      for (const issue of zodErr.issues) {
        const field = issue.path[0] as FieldName<T>;
        if (!next[field]) next[field] = issue.message;
      }
      syncErrors(next);
      return next;
    }
  }, [syncErrors]);

  const validateField = useCallback((name: FieldName<T>): string | null => {
    if (!schemaRef.current) return null;
    try {
      schemaRef.current.parse(valuesRef.current);
      return null;
    } catch (err) {
      const zodErr = err as ZodError;
      const issue = zodErr.issues.find((e) => e.path[0] === name);
      return issue?.message || null;
    }
  }, []); // no deps — reads schemaRef at call time

  // ================= REGISTER =================
  // Cache stable field handlers so register() never returns new object refs.
  const fieldHandlersRef = useRef<
    Partial<Record<FieldName<T>, RegisterReturn>>
  >({});

  const register = useCallback(
    (name: FieldName<T>): RegisterReturn => {
      if (fieldHandlersRef.current[name]) {
        return fieldHandlersRef.current[name]!;
      }

      const handlers: RegisterReturn = {
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

      fieldHandlersRef.current[name] = handlers;
      return handlers;
    },
    [validateField, syncErrors], // stable deps — safe
  );

  // ================= HELPERS =================

  const setValue = useCallback((name: FieldName<T>, value: string) => {
    (valuesRef.current as any)[name] = value;
    inputRefs.current[name]?.setNativeProps({ text: value });
  }, []);

  const getValues = useCallback(() => ({ ...valuesRef.current }) as T, []);

  const setFocus = useCallback((name: FieldName<T>) => {
    inputRefs.current[name]?.focus();
  }, []);

  const reset = useCallback(
    (next?: Partial<T>) => {
      const values = next ?? defaultValues;
      valuesRef.current = { ...values };
      touchedRef.current = {};
      syncErrors({});
      Object.keys(inputRefs.current).forEach((key) => {
        const k = key as FieldName<T>;
        inputRefs.current[k]?.setNativeProps({
          text: (values as any)[k] ?? "",
        });
      });
    },
    [defaultValues, syncErrors],
  );

  // ================= SUBMIT =================

  const handleSubmit = useCallback(
    (onValid: (data: T) => void, onInvalid?: (errors: FormErrors<T>) => void) =>
      () => {
        const errs = validateAll();
        if (Object.keys(errs).length > 0) {
          const first = Object.keys(errs)[0] as FieldName<T>;
          inputRefs.current[first]?.focus();
          onInvalid?.(errs);
          return;
        }
        onValid(valuesRef.current as T);
      },
    [validateAll],
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
  };
}
