import React from 'react';
import { motion } from 'motion/react';
import { Shield, UserCheck, Heart, AlertTriangle, EyeOff, Ban, Info, ChevronRight, Scale, Users, Camera, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';

const GuidelineSection = ({ icon: Icon, title, content, color }: { icon: any, title: string, content: string[], color: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="vibe-card p-6 border-l-4"
    style={{ borderLeftColor: color }}
  >
    <div className="flex items-center space-x-3 mb-4">
      <div className={`p-2 rounded-xl`} style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color: color }} />
      </div>
      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
    </div>
    <ul className="space-y-3">
      {content.map((item, i) => (
        <li key={i} className="flex items-start space-x-2 text-sm text-vibe-muted">
          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-vibe-neon-blue" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div className="pt-24 pb-20 px-4 min-h-screen bg-vibe-bg gaming-grid">
      <SEO 
        title="Diretrizes da Comunidade Gamer Playzi" 
        description="Regras de participacao e seguranca na Playzi. Mantendo nossa comunidade gamer segura, inclusiva e respeitosa para todos os jogadores do Brasil." 
        url="https://playzi.app.br/diretrizes"
        breadcrumbs={[{ name: 'Diretrizes', url: '/diretrizes' }]}
      />
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-vibe-neon-blue/10 rounded-3xl mb-6 shadow-glow-blue"
          >
            <Shield className="w-12 h-12 text-vibe-neon-blue" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
            Regras de <span className="text-vibe-neon-blue">Participação</span>
          </h1>
          <p className="text-vibe-muted max-w-xl mx-auto font-medium">
            A Playzi é um espaço para fazer conexões gentis de forma segura, inclusiva e respeitosa. 
            Nossas diretrizes ajudam a manter todos os membros protegidos.
          </p>
        </div>

        <div className="grid gap-6">
          <GuidelineSection 
            icon={UserCheck}
            title="Diretrizes de Perfil"
            color="#00f3ff"
            content={[
              "Idade: Você precisa ter pelo menos 18 anos para participar da Playzi.",
              "Autenticidade: Não permitimos deturpação intencional de idade ou identidade (catfishing).",
              "Fotos: Pelo menos uma foto deve mostrar claramente seu rosto completo, sem filtros excessivos.",
              "Fotos com crianças: Não permitimos fotos de crianças sozinhas ou em situações inadequadas.",
              "Nome de usuário: Deve ser uma representação autêntica de como você é chamado, sem símbolos ofensivos ou propaganda."
            ]}
          />

          <GuidelineSection 
            icon={Heart}
            title="Conduta e Respeito"
            color="#ff00e5"
            content={[
              "Gentileza: Bullying, assédio ou qualquer comportamento abusivo resultará em banimento imediato.",
              "Inclusão: Proibimos qualquer discurso de ódio baseado em raça, gênero, orientação sexual ou religião.",
              "Assédio Sexual: Temos tolerância zero para cyberflashing ou qualquer comentário sexual indesejado.",
              "Segurança: Nunca compartilhe dados bancários ou financeiros com outros membros."
            ]}
          />

          <GuidelineSection 
            icon={EyeOff}
            title="Conteúdo Proibido"
            color="#ff3b3b"
            content={[
              "Nudez: Não permitimos conteúdo sexualmente explícito ou vulgar em perfis ou chats.",
              "Violência: Imagens de armas, sangue ou glorificação de atos violentos são proibidas.",
              "Substâncias: É proibida a promoção ou venda de drogas, álcool ou substâncias controladas.",
              "Terrorismo e Extremismo: Proibimos qualquer conteúdo que promova ou apoie grupos terroristas.",
              "Automutilação: Não permitimos conteúdo que retrate ou promova suicídio ou distúrbios alimentares.",
              "Spam: Não use a plataforma para fins comerciais, vendas ou envio de links enganosos."
            ]}
          />

          <GuidelineSection 
            icon={Shield}
            title="Golpes e Fraudes"
            color="#ffa800"
            content={[
              "Marketplace: Playzi não é um mercado. Não venda contas ou serviços.",
              "Engano: Proibimos solicitar apoio financeiro ou mentir sobre intenções para obter ganhos.",
              "Links: Não compartilhe links para sites externos suspeitos ou de phishing."
            ]}
          />

          <GuidelineSection 
            icon={Scale}
            title="Nossa Filosofia de Medidas"
            color="#fbff00"
            content={[
              "Monitoramento: Usamos moderadores e sistemas automatizados para revisar denúncias.",
              "Remoção: Conteúdos que violam as regras são excluídos sem aviso prévio.",
              "Banimento: Comportamentos graves resultam em banimento de todos os apps da rede.",
              "Fora da Plataforma: Comportamentos prejudiciais fora do app (em encontros presenciais) também podem resultar em punição.",
              "Denuncie: Se algo fizer você se sentir desconfortável, use as ferramentas de Bloqueio e Denúncia."
            ]}
          />
        </div>

        {/* Action Call */}
        <div className="mt-12 p-8 vibe-card text-center border-vibe-neon-blue/20 bg-vibe-neon-blue/5">
          <h4 className="text-xl font-bold text-white mb-4 italic uppercase">Sua segurança é nossa prioridade</h4>
          <p className="text-vibe-muted text-sm mb-8">
            Ao clicar no botão abaixo ou continuar usando o app, você concorda em seguir todas as nossas diretrizes. 
            Viu algo errado? Use o botão "Denunciar" em qualquer perfil.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-widest rounded-2xl shadow-glow-blue hover:scale-105 transition-all"
          >
            Eu Entendo e Concordo
          </button>
        </div>

        <div className="mt-12 text-center text-[10px] text-vibe-muted font-bold uppercase tracking-widest">
          Última atualização: 03 de Maio de 2026 • Playzi Network
        </div>
      </div>
    </div>
  );
}
