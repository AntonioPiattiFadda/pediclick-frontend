import type { ZodIssue } from "zod";

export const ValidationErrorMessage = ({
  zErrors,
  fieldName,
}: {
  zErrors: ZodIssue[];
  fieldName: string;
}) => {
  const isError = zErrors?.find((error: ZodIssue) => error.path.includes(fieldName));

  return (
    isError && (
      <span className="text-red-500 text-sm absolute -bottom-6 right-0">
        {(() => {
          const err = zErrors.find((error: ZodIssue) => error.path.includes(fieldName));
          return err ? err.message : null;
        })()}
      </span>
    )
  );
};
