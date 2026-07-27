import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  // prova de posse da conta ao trocar senha ou e-mail; sem MinLength, senão a
  // regra de tamanho da senha nova vaza p/ a senha antiga de contas legadas
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentPassword?: string
}
