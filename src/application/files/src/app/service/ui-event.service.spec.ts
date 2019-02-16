import { TestBed, inject } from '@angular/core/testing';

import { UIEventService } from './ui-event.service';

describe('UiEventService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UIEventService]
    });
  });

  it('should be created', inject([UIEventService], (service: UIEventService) => {
    expect(service).toBeTruthy();
  }));
});
