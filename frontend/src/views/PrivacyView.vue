<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CONSENT_VERSION } from '../services/guest'

// PENDÊNCIA: trocar os [PLACEHOLDERS] pelos dados do controlador antes de divulgar o app.
const CONTROLLER = {
  name: '[NOME OU RAZÃO SOCIAL]',
  document: '[CPF OU CNPJ]',
  email: '[E-MAIL DE CONTATO]',
}

const LAST_UPDATE = '20 de julho de 2026'
</script>

<template>
  <main class="min-h-screen bg-ivory-50 px-6 py-12 font-sans">
    <article class="mx-auto max-w-2xl">
      <RouterLink to="/" class="text-xs text-champagne-600 underline underline-offset-2">
        ← Voltar
      </RouterLink>

      <h1 class="mt-6 font-display text-4xl font-semibold text-stone-800">
        Política de Privacidade
      </h1>
      <div class="mt-4 mb-8 h-px w-16 bg-champagne-400" />

      <p class="text-sm font-light text-stone-500">
        Última atualização: {{ LAST_UPDATE }} · Versão do termo de imagem: {{ CONSENT_VERSION }}
      </p>

      <div class="mt-8 space-y-8 text-sm leading-relaxed font-light text-stone-600">
        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Quem somos</h2>
          <p>
            O Momentos é um serviço que permite que convidados de um casamento fotografem a festa
            pelo próprio celular e enviem as fotos para um álbum coletivo do casal. O controlador
            dos dados pessoais tratados aqui, nos termos da Lei nº 13.709/2018 (LGPD), é
            <strong class="font-medium text-stone-700">{{ CONTROLLER.name }}</strong>, inscrito sob
            o nº {{ CONTROLLER.document }}, contato
            <a
              :href="`mailto:${CONTROLLER.email}`"
              class="font-medium text-champagne-600 underline underline-offset-2"
            >
              {{ CONTROLLER.email }}
            </a>.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Que dados coletamos</h2>
          <p class="mb-3">
            <strong class="font-medium text-stone-700">Do casal (titular da conta):</strong> nome,
            e-mail e senha (guardada apenas como hash, nunca em texto legível). Se você entrar com o
            Google, recebemos apenas nome e e-mail da conta — nunca sua senha do Google.
          </p>
          <p class="mb-3">
            <strong class="font-medium text-stone-700">Do convidado:</strong> as fotos enviadas e,
            se você quiser se identificar, o primeiro nome. O nome é opcional — dá para fotografar
            sem informar nada. Também registramos a data e a versão do termo de uso de imagem que
            você aceitou, para comprovar o consentimento.
          </p>
          <p>
            Não coletamos localização, não usamos cookies de publicidade e não rastreamos você entre
            sites.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">
            Por que tratamos esses dados
          </h2>
          <ul class="list-disc space-y-1.5 pl-5">
            <li>
              <strong class="font-medium text-stone-700">Fotos dos convidados:</strong> com base no
              seu consentimento (art. 7º, I da LGPD), dado no aceite antes de abrir a câmera. A
              finalidade é única: montar o álbum daquele casamento para o casal.
            </li>
            <li>
              <strong class="font-medium text-stone-700">Conta do casal:</strong> para executar o
              contrato de prestação do serviço (art. 7º, V).
            </li>
            <li>
              <strong class="font-medium text-stone-700">E-mails transacionais</strong> (confirmação
              de evento, recuperação de senha): também para execução do contrato. Não enviamos
              marketing.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">
            Uso de imagem: o que você está autorizando
          </h2>
          <p class="mb-3">
            Ao marcar o aceite, você autoriza que as fotos que enviar sejam compartilhadas com o
            casal daquele evento, dentro do álbum privado dele. Essa autorização é gratuita e
            limitada a essa finalidade.
          </p>
          <p class="mb-3">
            <strong class="font-medium text-stone-700">
              Não usamos suas fotos para divulgar o Momentos
            </strong>
            , não vendemos, não licenciamos para terceiros e não publicamos em redes sociais. O que
            o casal faz com as fotos depois de baixá-las é responsabilidade dele.
          </p>
          <p>
            Se você aparece em uma foto enviada por outra pessoa e quer que ela seja removida,
            escreva para {{ CONTROLLER.email }} — retiramos do álbum.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">
            Por quanto tempo guardamos
          </h2>
          <p>
            As fotos ficam disponíveis por
            <strong class="font-medium text-stone-700">7 dias após o encerramento do evento</strong>
            e depois são excluídas dos nossos servidores, em qualquer plano. É o tempo para o casal
            baixar o álbum. Os dados da conta do casal permanecem enquanto a conta existir; ao
            excluí-la, apagamos tudo o que estiver vinculado a ela.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Com quem compartilhamos</h2>
          <p class="mb-3">
            Apenas com os fornecedores necessários para o serviço funcionar, todos atuando como
            operadores:
          </p>
          <ul class="list-disc space-y-1.5 pl-5">
            <li>Armazenamento das fotos e hospedagem da aplicação;</li>
            <li>Envio de e-mails transacionais;</li>
            <li>Autenticação com Google, se o casal escolher esse login.</li>
          </ul>
          <p class="mt-3">
            Parte da infraestrutura pode estar fora do Brasil. Nunca vendemos dados pessoais.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Seus direitos</h2>
          <p class="mb-3">
            A LGPD garante que você peça confirmação do tratamento, acesso, correção, anonimização,
            portabilidade ou exclusão dos seus dados, além de revogar o consentimento a qualquer
            momento.
          </p>
          <p>
            Para exercer qualquer um deles, escreva para
            <a
              :href="`mailto:${CONTROLLER.email}`"
              class="font-medium text-champagne-600 underline underline-offset-2"
            >
              {{ CONTROLLER.email }}
            </a>
            . Respondemos em até 15 dias. Revogar o consentimento não desfaz o que já foi feito
            legitimamente antes do pedido, mas interrompe o uso dali em diante.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Segurança</h2>
          <p>
            As senhas são guardadas com hash, o tráfego é criptografado (HTTPS) e o acesso ao álbum
            exige autenticação do casal. Os links das fotos são temporários e expiram. Nenhum
            sistema é infalível: se acontecer um incidente que traga risco relevante, comunicamos os
            titulares e a ANPD.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Crianças</h2>
          <p>
            Fotos de crianças e adolescentes só devem ser enviadas com autorização de quem é
            responsável por elas. Se identificarmos envio sem essa autorização, removemos a foto.
          </p>
        </section>

        <section>
          <h2 class="mb-2 font-display text-xl font-medium text-stone-800">Mudanças</h2>
          <p>
            Se esta política mudar de forma relevante, atualizamos a data acima e a versão do termo.
            Quando o termo de imagem muda de versão, pedimos um novo aceite antes do próximo envio.
          </p>
        </section>
      </div>
    </article>
  </main>
</template>
