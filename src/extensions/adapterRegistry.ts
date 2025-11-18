import { LoxraAdapter } from './adapter';
import { SwiftMt103Adapter } from './adapters/SwiftMt103Adapter';
import { FedwireAdapter } from './adapters/FedwireAdapter';
import { AchNachAdapter } from './adapters/AchNachAdapter';

export const AVAILABLE_ADAPTERS: Array<new () => LoxraAdapter> = [SwiftMt103Adapter, FedwireAdapter, AchNachAdapter];

export function loadAllAdapters(): LoxraAdapter[] {
  return AVAILABLE_ADAPTERS.map((AdapterCtor) => new AdapterCtor());
}
