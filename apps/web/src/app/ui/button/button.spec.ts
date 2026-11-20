import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<button appButton type="button" (click)="clicks = clicks + 1">
    Go
  </button>`,
})
class Harness {
  clicks = 0;
}

describe('Button', () => {
  it('projects its content and stays a native button', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    )!;

    expect(button.textContent?.trim()).toBe('Go');
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});
