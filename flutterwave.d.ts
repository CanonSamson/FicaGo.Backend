declare module 'flutterwave-node-v3' {
  class Flutterwave {
    constructor(publicKey: string, secretKey: string)

    // Add any methods you plan to use from the Flutterwave SDK
    // For example:
    Transaction: {
      initiate(payload: any): Promise<any>
      verify(payload: any): Promise<any>
    }

    Transfer: {
      initiate(payload: any): Promise<any>
      verify(payload: any): Promise<any>
    }
  }
  export default Flutterwave
}
