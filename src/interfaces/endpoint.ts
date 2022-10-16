import type { HttpRequestMethod } from '@nutsapi/types';

export interface EndpointTypes {
  request: {
    type: string
  },
  response: {
    returnCode: number,
    type: string
  }[]
}

export interface EndpointFiles {
  uri: string,
  files: { method: HttpRequestMethod, filePath: string },
}
