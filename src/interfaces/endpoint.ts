export interface EndpointTypes {
  request: {
    type: string
  },
  response: {
    returnCode: number,
    type: string
  }[]
}
