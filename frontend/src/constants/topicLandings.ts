// Public landing pages for the main search intents (people looking to chat, make friends or date).
// They are the pages search engines can actually read: everything inside the app needs a login.

export interface TopicLanding {
  path: string;
  seoTitle: string;
  description: string;
  keywords: string;
  badge: string;
  h1: string;
  intro: string;
  adultsOnly?: boolean;
  features: { title: string; text: string }[];
  steps: string[];
  safetyTitle: string;
  safetyTips: string[];
  faq: { q: string; a: string }[];
  appPath: string;
  appLabel: string;
  related: { label: string; to: string }[];
}

export const TOPIC_LANDINGS: Record<string, TopicLanding> = {
  'conhecer-pessoas': {
    path: '/conhecer-pessoas',
    seoTitle: 'Conhecer pessoas novas e fazer amizades online',
    description: 'Conheça pessoas novas que curtem os mesmos jogos e interesses que você. Converse no chat ao vivo, chame para jogar e faça amizades online. Grátis.',
    keywords: 'conhecer pessoas, conhecer pessoas novas, fazer amizades online, app para fazer amigos, aplicativo para conhecer pessoas, amizade online',
    badge: 'Amizades',
    h1: 'Conheça pessoas novas e faça amizades online',
    intro: 'No Playzi você encontra gente que curte os mesmos jogos, músicas e assuntos que você. Monte seu perfil com o que você gosta, veja quem tem afinidade com você e comece a conversar na hora: pelo chat, numa chamada ou jogando junto.',
    features: [
      { title: 'Perfis com interesses de verdade', text: 'Jogos favoritos, estilo de jogo, música e o que cada pessoa procura: amizade, alguém para jogar ou só conversar.' },
      { title: 'Sugestões por afinidade', text: 'O Playzi sugere pessoas com jogos e interesses em comum, para o primeiro papo sair fácil.' },
      { title: 'Chat ao vivo e mensagens privadas', text: 'Converse no chat global com quem está online agora e continue no privado com quem você conheceu.' },
      { title: 'Comunidades por jogo e assunto', text: 'Grupos de Free Fire, Minecraft, amizade e outros para achar sua turma e marcar partidas.' }
    ],
    steps: [
      'Entre com sua conta Google, sem precisar criar senha.',
      'Monte seu perfil com seus jogos, interesses e o que você procura.',
      'Puxe conversa, chame para jogar e faça novas amizades.'
    ],
    safetyTitle: 'Dicas para fazer amizades com segurança',
    safetyTips: [
      'Guarde para você dados pessoais como endereço, telefone e onde você estuda ou trabalha.',
      'Converse um tempo pelo Playzi antes de passar suas outras redes.',
      'Desconfie de quem pede dinheiro, senhas ou fotos íntimas.',
      'Denuncie perfis abusivos pelo botão de denúncia no perfil.'
    ],
    faq: [
      { q: 'O Playzi é gratuito?', a: 'Sim. Criar perfil, conversar no chat e participar das comunidades é grátis.' },
      { q: 'Como encontrar pessoas com os mesmos gostos?', a: 'Preencha seus jogos favoritos e interesses no perfil. O Playzi usa essas informações para sugerir pessoas com afinidade com você.' },
      { q: 'Preciso instalar algum aplicativo?', a: 'Não. O Playzi funciona no navegador do celular e do computador, e também pode ser instalado no celular como aplicativo.' },
      { q: 'Qual a idade mínima para usar o Playzi?', a: 'O Playzi é para maiores de 18 anos.' }
    ],
    appPath: '/users',
    appLabel: 'Encontrar pessoas agora',
    related: [
      { label: 'Chat ao vivo', to: '/chat-ao-vivo' },
      { label: 'Relacionamento (18+)', to: '/relacionamento' },
      { label: 'Como fazer amizades online jogando', to: '/blog/como-fazer-amizades-online-jogando' },
      { label: 'Melhores jogos para fazer amigos online', to: '/blog/melhores-jogos-para-fazer-amigos-online' }
    ]
  },

  'chat-ao-vivo': {
    path: '/chat-ao-vivo',
    seoTitle: 'Chat ao vivo grátis: bate-papo online para conversar',
    description: 'Converse em tempo real com gente do Brasil todo no chat ao vivo do Playzi: chat global, salas por jogo, mensagens privadas e chamadas. Grátis.',
    keywords: 'chat ao vivo, bate-papo online, chat online grátis, sala de bate-papo, chat para conversar, bate papo ao vivo',
    badge: 'Bate-papo ao vivo',
    h1: 'Chat ao vivo para conversar e conhecer gente nova',
    intro: 'Bate-papo em tempo real e sem complicação: entre com sua conta Google e já pode conversar no chat global, nas salas das comunidades ou em mensagens privadas com quem você conhecer.',
    features: [
      { title: 'Chat global', text: 'Uma sala aberta, ao vivo, para conversar com quem está online neste momento.' },
      { title: 'Salas por jogo e assunto', text: 'Comunidades de Free Fire, Minecraft, amizade e outras, cada uma com seu próprio chat.' },
      { title: 'Mensagens privadas', text: 'Gostou da conversa? Continue no privado, só entre vocês dois.' },
      { title: 'Chamadas e Watch Party', text: 'Chame para uma chamada de voz 1v1 ou assista vídeos do YouTube juntos, em sincronia.' }
    ],
    steps: [
      'Entre com sua conta Google.',
      'Escolha o chat global ou a sala de uma comunidade.',
      'Mande a primeira mensagem e continue no privado se quiser.'
    ],
    safetyTitle: 'Para conversar com segurança',
    safetyTips: [
      'Nunca compartilhe senhas, documentos ou dados bancários no chat.',
      'Desconfie de links estranhos e de quem pede dinheiro.',
      'Respeite as diretrizes da comunidade: ofensas e assédio não são permitidos.',
      'Denuncie perfis abusivos pelo botão de denúncia no perfil.'
    ],
    faq: [
      { q: 'O chat ao vivo é grátis?', a: 'Sim. O chat global, as salas das comunidades e as mensagens privadas são gratuitos.' },
      { q: 'Precisa fazer cadastro?', a: 'Basta entrar com uma conta Google. Você não precisa criar senha nem preencher formulário longo.' },
      { q: 'Dá para usar o chat pelo celular?', a: 'Sim. O Playzi funciona no navegador do celular e também pode ser instalado como aplicativo.' },
      { q: 'Além de texto, tem chamada?', a: 'Sim. Na lista de pessoas você pode chamar alguém para uma chamada de voz 1v1.' }
    ],
    appPath: '/chat/global',
    appLabel: 'Abrir o chat ao vivo',
    related: [
      { label: 'Conhecer pessoas', to: '/conhecer-pessoas' },
      { label: 'Relacionamento (18+)', to: '/relacionamento' },
      { label: 'Comunidades de games', to: '/communities' },
      { label: 'Como fazer amizades online jogando', to: '/blog/como-fazer-amizades-online-jogando' }
    ]
  },

  'relacionamento': {
    path: '/relacionamento',
    seoTitle: 'App de relacionamento e encontros online (18+)',
    description: 'No Encontros do Playzi você dá match com pessoas que curtem os mesmos jogos e interesses e conversa no privado. Grátis e exclusivo para maiores de 18.',
    keywords: 'app de relacionamento, aplicativo de relacionamento grátis, encontros online, namoro online, conhecer pessoas para namorar, site de relacionamento',
    badge: 'Encontros • 18+',
    h1: 'Relacionamento e encontros para quem curte games',
    intro: 'Amizade que vira namoro, duo que vira casal: no Encontros você vê perfis com fotos, jogos favoritos e interesses, curte quem chamou sua atenção e, se a curtida for recíproca, é match. Aí é só conversar no privado.',
    adultsOnly: true,
    features: [
      { title: 'Match por afinidade', text: 'Curta os perfis de que gostar. Quando a curtida é mútua, vocês dão match.' },
      { title: 'Perfis com fotos e interesses', text: 'Jogos favoritos, música, estilo de jogo e o que cada pessoa procura.' },
      { title: 'Conversa no privado', text: 'Depois do match, a conversa continua por mensagem, no seu ritmo.' },
      { title: 'Regras claras', text: 'Respeito em primeiro lugar: perfis que desrespeitam as diretrizes podem ser denunciados.' }
    ],
    steps: [
      'Entre com sua conta Google e complete seu perfil com fotos.',
      'Abra o Encontros e curta quem chamar sua atenção.',
      'Deu match? Puxe assunto pelo jogo ou interesse em comum.'
    ],
    safetyTitle: 'Dicas para encontros com segurança',
    safetyTips: [
      'Converse bastante pelo Playzi antes de passar seu número.',
      'No primeiro encontro presencial, escolha um lugar público e avise alguém de confiança.',
      'Nunca envie dinheiro, dados bancários ou fotos íntimas para quem você conheceu online.',
      'Se alguém for desrespeitoso, denuncie o perfil.'
    ],
    faq: [
      { q: 'O Playzi é um app de relacionamento?', a: 'Também. Além de amizades, chat ao vivo e comunidades de games, o Playzi tem o Encontros, onde você dá match com pessoas que têm interesses parecidos com os seus.' },
      { q: 'O Encontros é grátis?', a: 'Sim. Curtir perfis, dar match e conversar não custa nada.' },
      { q: 'Como funciona o match?', a: 'Você curte os perfis de que gostar. Se a outra pessoa também curtir o seu, vocês dão match e podem conversar no privado.' },
      { q: 'Qual a idade mínima?', a: 'O Encontros, assim como todo o Playzi, é exclusivo para maiores de 18 anos.' }
    ],
    appPath: '/encontros',
    appLabel: 'Abrir o Encontros',
    related: [
      { label: 'Conhecer pessoas', to: '/conhecer-pessoas' },
      { label: 'Chat ao vivo', to: '/chat-ao-vivo' },
      { label: 'Melhores apps de namoro para gamers', to: '/blog/melhores-apps-namoro-gamer-2026' },
      { label: 'App para conhecer gamers no Brasil', to: '/blog/app-para-conhecer-gamers-brasil' }
    ]
  }
};
