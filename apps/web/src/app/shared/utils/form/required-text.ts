import {
  type SchemaPath,
  required,
  requiredError,
  validate,
} from '@angular/forms/signals';

/**
 * Makes a text field required and rejects whitespace-only values, like Bean
 * Validation's `@NotBlank` on the API. `required` alone only catches the empty string.
 */
export function requiredText(path: SchemaPath<string>, label: string): void {
  const message = `${label} is required`;
  required(path, { message });
  validate(path, ({ value }) =>
    value() !== '' && value().trim() === ''
      ? requiredError({ message })
      : undefined,
  );
}
