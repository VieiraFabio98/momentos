import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { UserEntity } from '../../modules/users/infra/entities/user.entity'
import { AppDataSource } from '../data-source'

// Cria (ou promove) o usuário admin — a conta que cria eventos sem assinatura
// ativa. Idempotente: rodar de novo só garante role=admin e, se ADMIN_PASSWORD
// mudar, atualiza o hash. Credenciais vêm do .env:
//   ADMIN_EMAIL, ADMIN_PASSWORD (obrigatórios), ADMIN_NAME (opcional)
//
// Uso: npm run seed:admin
async function run(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'Admin'

  if (!email || !password) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env antes de rodar o seed')
  }

  await AppDataSource.initialize()

  try {
    const repository = AppDataSource.getRepository(UserEntity)
    const passwordHash = await bcrypt.hash(password, 10)

    const existing = await repository.findOneBy({ email })
    if (existing) {
      existing.role = 'admin'
      existing.passwordHash = passwordHash
      existing.name = name
      await repository.save(existing)
      console.log(`Admin já existia — atualizado e promovido: ${email}`)
      return
    }

    const admin = repository.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      subscriptionPlan: null,
    })
    await repository.save(admin)
    console.log(`Admin criado: ${email}`)
  } finally {
    await AppDataSource.destroy()
  }
}

run().catch((error) => {
  console.error('Falha no seed do admin:', error)
  process.exit(1)
})
