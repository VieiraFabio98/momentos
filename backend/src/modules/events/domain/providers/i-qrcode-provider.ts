export const QRCODE_PROVIDER = Symbol('QRCODE_PROVIDER')

export interface IQrCodeProvider {
  toDataUrl(content: string): Promise<string>
}
