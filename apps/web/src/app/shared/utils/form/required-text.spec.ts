import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { requiredText } from './required-text';

describe('requiredText', () => {
  function errorsFor(value: string): string[] {
    return TestBed.runInInjectionContext(() => {
      const f = form(signal({ name: value }), (path) =>
        requiredText(path.name, 'Name'),
      );
      return f
        .name()
        .errors()
        .map((e) => e.message ?? '');
    });
  }

  it.each([[''], ['   ']])('rejects %j', (value) => {
    expect(errorsFor(value)).toEqual(['Name is required']);
  });

  it('accepts text', () => {
    expect(errorsFor('Clubkaart')).toEqual([]);
  });
});
