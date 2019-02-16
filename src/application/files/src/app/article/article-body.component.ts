
import { Component, EventEmitter, Output } from '@angular/core';

export abstract class BodyComponentBase {
    abstract id;
    @Output()
    private iconClickEmitter = new EventEmitter<BodyComponentBase>();
    onBodyMarkerClick(): void {
        this.iconClickEmitter.emit(this);
    }
    public getId(): string {
        return this.id;
    }
}
<%= bodyComponents %>