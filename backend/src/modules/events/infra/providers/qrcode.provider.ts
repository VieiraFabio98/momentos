import { Injectable } from '@nestjs/common'
import * as QRCode from 'qrcode'
import { IQrCodeProvider } from '../../domain/providers/i-qrcode-provider'

@Injectable()
export class QrcodeLibProvider implements IQrCodeProvider {
  toDataUrl(content: string): Promise<string> {
    return QRCode.toDataURL(content, {
      width: 600,
      margin: 2,
      color: { dark: '#44403c', light: '#fdfbf7' },
    })
  }
}
