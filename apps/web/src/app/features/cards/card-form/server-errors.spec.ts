import { splitViolations } from './server-errors';

describe('splitViolations', () => {
  const fields = ['name', 'cardNumber'];

  it('separates violations for form fields from the rest', () => {
    const result = splitViolations(
      [
        { field: 'cardNumber', message: 'bad' },
        { field: 'version', message: 'missing' },
      ],
      fields,
    );
    expect(result.forFields.map((v) => v.field)).toEqual(['cardNumber']);
    expect(result.other.map((v) => v.field)).toEqual(['version']);
  });

  it('handles no violations', () => {
    expect(splitViolations([], fields)).toEqual({ forFields: [], other: [] });
  });
});
