import { NutsAPIError } from './base';

class InvaildEndpointError extends NutsAPIError {
  constructor(public path: string, e?: string) {
    super(e);
  }
}

export class RequestTypeNotFoundError extends InvaildEndpointError {}
export class ResponseTypeNotFoundError extends InvaildEndpointError {}
