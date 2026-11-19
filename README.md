# Wagner Jorcuvich — portfólio

Layout em preto, branco e vermelho, desenvolvido em HTML, CSS e JavaScript puro. Sem framework, dependências de execução ou etapa de compilação.

## Abrir

Abra `index.html` no navegador. A entrada encaminha para `html/index.html`, preservando os parâmetros e a âncora do endereço.

Para servir pela rede local, execute na raiz:

```powershell
python -m http.server 8080
```

Acesse `http://localhost:8080`. O envio do formulário de contato precisa de internet.

## Organização

```text
index.html                  Entrada do site
html/
  index.html                Estrutura e conteúdo estático
css/
  fonts.css                 Fontes hospedadas localmente
  styles.css                Layout, temas, responsividade e animações CSS
  contact.css               Layout do formulário de contato
js/
  entry.js                  Encaminhamento da entrada e preservação de âncoras
  content.js                Dados originais de formação, projetos e publicações
  app.js                    Filtros, modal, menu, temas e contato
  contact.js                Rascunho temporário e envio ao Google Forms
  motion.js                 Scroll, entrada dos elementos, cards e fundo animado
assets/
  images/                   Foto e logo originais
  fonts/                    Fontes locais
```

## Conteúdo

Os textos, as seções, os dados, a foto e a logo foram preservados a partir de `https://conicas.com.br/`. O formulário tem apresentação própria e mantém os campos e o destino do Google Forms original. `js/content.js` contém os cinco conjuntos de dados completos: perfil, formação, projetos, publicações e informações acadêmicas adicionais. A interface utiliza os mesmos registros que o site original exibia. Campos não exibidos originalmente também permanecem nos dados.

Os links de projetos e publicações que apontavam para `#` foram mantidos assim. Substitua seus destinos em `js/content.js` quando os endereços reais estiverem disponíveis.

## Formulário de contato

O formulário em HTML/CSS envia por `POST` para o mesmo Google Forms, em uma nova aba. A confirmação de recebimento é exibida pelo Google; o site não anuncia sucesso apenas por iniciar a requisição. Nenhum Apps Script, servidor ou chave de API é necessário para esse fluxo.

| Campo | Nome enviado ao Google Forms | Obrigatório |
| --- | --- | --- |
| Nome | `entry.145575682` | Sim |
| Email | `entry.58088345` | Sim |
| Mensagem | `entry.1752555835` | Sim |
| Aceito contato por email | `entry.2103104253` | Não |

O JavaScript salva o preenchimento em `sessionStorage`, separado por aba, e o recupera após recarregar. O rascunho expira após 24 horas e pode ser apagado com **Limpar rascunho**. O envio mantém os campos preenchidos para permitir conferir o resultado no Google antes de descartá-los. Se o armazenamento estiver indisponível, o envio continua funcionando. Se estiver sem conexão, o site conserva o preenchimento e solicita uma nova tentativa manual quando a conexão voltar.

O envio nativo também funciona sem JavaScript, com a validação do navegador; nesse caso, não há recuperação de rascunho nem prevenção adicional de cliques repetidos. **Abrir formulário original** mantém uma alternativa de contato.

Esse fluxo usa o endereço público de envio do Google Forms. Se o proprietário alterar as perguntas ou as configurações de acesso, confira novamente os nomes dos campos e as permissões no formulário original.

## Movimento e navegação

- A folha e o cachorro do fundo são recortes da própria logo desenhados em canvas.
- Âncoras têm scroll animado, compensação do cabeçalho fixo, histórico e suporte a links diretos.
- Os cards flutuam quando visíveis e respondem ao mouse em dispositivos compatíveis.
- O botão de pausa interrompe o movimento. A preferência `prefers-reduced-motion` é respeitada automaticamente.
- O menu móvel tem overlay, navegação por teclado, contenção de foco e fechamento com Escape.
- O modal nativo adapta o gráfico à largura disponível e mantém a associação correta dos projetos após filtros e busca.

As famílias Manrope e Space Grotesk são distribuídas sob a SIL Open Font License. As licenças estão em `assets/fonts/`.
