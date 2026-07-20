import { Logger } from '@nestjs/common'
import { vi } from 'vitest'

// Casos de e-mail falhando são testes esperados: o Logger do Nest só sujaria a saída
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
