"use client";

import { useState, useEffect, useCallback, useRef, useTransition, useMemo, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  // Main Cockpit Icons
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Check,
  QrCode,
  Timer,
  Users,
  Building2,
  BookOpen,
  Zap,
  Radio,
  MonitorPlay,
  SkipBack,
  SkipForward,
  Library,
  X,
  Square,
  Flame,
  Sparkles,
  Signal,
  Clock,
  Search,
  GraduationCap,
  AlertCircle,
  Link2,
  Copy,
  
  // BNI Cockpit Icons
  ArrowLeftRight,
  FileText,
  Maximize2,
  Minimize2,
  LogOut,
  Mail,
  MessageSquare,
  Globe,
  Award,
  ShieldCheck,
  PartyPopper,
  Activity,
  AlertTriangle,
  Coins,
  ShieldAlert,
  GitCommit,
  ClipboardSignature,
  FileCheck2,
  AlertOctagon,
  HeartHandshake,
  Warehouse,
  PencilRuler,
  Sliders,
  TrendingDown,
  Wind,
  BatteryCharging,
  Construction,
  HeartPulse,
  Factory,
  FileSearch,
  ClipboardCheck,
  RefreshCw,
  DoorClosed,
  Laptop,
  CheckCircle,
  Briefcase,
  Key,
  Trophy,
  History,
} from "lucide-react";

/* ═══ Types ═══ */
interface Company {
  name: string;
}

interface Training {
  id: string;
  name: string;
  total_hours: number;
}

interface ClassFromDB {
  id: string;
  status: "agendada" | "em_andamento" | "concluida" | "cancelada";
  qr_code_token: string;
  scheduled_at: string;
  started_at: string | null;
  company: Company;
  training: Training;
  interaction_mode?: boolean;
  active_subtheme_id?: string | null;
}

interface Subtheme {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  canva_embed: string | null;
  category: string;
  level: string;
  description: string | null;
}

interface Attendance {
  checked_in_at: string;
  student: {
    full_name: string;
    email: string;
    cpf: string;
  };
}

/* ═══ Helper: Sanitize Canva Presentation Link for Iframe Embedding ═══ */
function cleanCanvaUrl(url: string | null): string {
  if (!url) return "";
  
  let target = url.trim();

  // 1. Se colou a tag <iframe> inteira, extrai o src
  if (target.toLowerCase().includes("<iframe")) {
    const match = target.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      target = match[1];
    }
  }

  // 2. Se for link do Canva, garante formato de embed (?embed)
  if (target.includes("canva.com/")) {
    const baseUrl = target.split("?")[0];
    if (baseUrl.endsWith("/view") || baseUrl.endsWith("/watch")) {
      return `${baseUrl}?embed`;
    } else if (baseUrl.match(/\/design\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/) || baseUrl.match(/\/design\/[a-zA-Z0-9_-]+$/)) {
      return `${baseUrl}/view?embed`;
    }
    return `${baseUrl}?embed`;
  }

  return target;
}

/* ═══ Helper: Map Subtheme to local PDF presented offline ═══ */
function getLocalPdfForSubtheme(subtheme: Subtheme | null | undefined): string | null {
  if (!subtheme) return null;
  const title = subtheme.title.toLowerCase();
  const category = subtheme.category?.toLowerCase() || "";

  if (title.includes("veículos elétricos") || title.includes("veículo elétrico") || title.includes("veiculos eletricos") || title.includes("incêndio em ve") || title.includes("incendio em ve")) {
    return "/apresentacoes/Incendio_em_VE.pdf";
  }
  if (title.includes("direção segura") || title.includes("direcao segura") || title.includes("trânsito") || title.includes("transito")) {
    return "/apresentacoes/Direcao_segura.pdf";
  }
  if (title.includes("evacuação") || title.includes("evacuacao") || title.includes("evacuar") || title.includes("abandono")) {
    return "/apresentacoes/Evacuacao_populacao_fixa.pdf";
  }
  if (category.includes("primeiros socorros") || title.includes("vida") || title.includes("socorros") || title.includes("bleed") || title.includes("fratura") || title.includes("hemorragia") || title.includes("sinais vitais") || title.includes("ovace") || title.includes("engasg") || title.includes("queimadura")) {
    return "/apresentacoes/Primeiros_socorros.pdf";
  }
  if (category.includes("combate") || category.includes("incêndio") || category.includes("incendio") || title.includes("extintor") || title.includes("fogo") || title.includes("brigada") || title.includes("hidrante") || title.includes("preventiva")) {
    return "/apresentacoes/Combate_a_incendio.pdf";
  }
  return null;
}

/* ═══ Timer Hook ═══ */
function useTimer(initialSeconds = 0, isRunning = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(isRunning);

  useEffect(() => {
    setRunning(isRunning);
  }, [isRunning]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const formatted = [
    String(Math.floor(seconds / 3600)).padStart(2, "0"),
    String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    String(seconds % 60).padStart(2, "0"),
  ].join(":");

  return { seconds, formatted, running, setRunning, toggle: () => setRunning((r) => !r) };
}

/* ═══ Presentation Slide Databases (6 slides per deck, Video Slide 6 omitted) ═══ */
const SPEAKER_NOTES: Record<string, Record<number, { title: string; speech: string; bullets: string[] }>> = {
  eventos: {
    1: {
      title: "Slide 1: Abertura & Portfólio (Tempo: 0:45)",
      speech: "Bom dia, BNI! Sou Paulo Ramos, Gestor de Segurança Corporativa da SC FIRE com atuação desde 1996. Nascemos em 2012 no Planeta Atlântida e atuamos na Copa de 2014. Nosso foco é Eventos, Projetos e Treinamentos.",
      bullets: ["Apresente-se com voz firme.", "Destaque a experiência desde 1996 e as especializações em Segurança Contra Incêndio.", "Introduza o portfólio triplo."]
    },
    2: {
      title: "Slide 2: Setor em Floripa & Riscos (Tempo: 0:45)",
      speech: "Em Florianópolis, o turismo e o trade de eventos geram mais de R$ 4 bilhões por ano na economia, sustentando milhares de famílias o ano inteiro.",
      bullets: ["Apresente o PIB de 76,1% em Serviços.", "Explique o impacto do trade de eventos injetando R$ 4 Bilhões por ano.", "Destaque o risco real de cancelamentos e embargos."]
    },
    3: {
      title: "Slide 3: O Flow do Nosso Trabalho (Tempo: 0:45)",
      speech: "Blindamos sua operação em 4 passos: Briefing de risco, Documentação e ART, Dimensionamento e Acompanhamento Técnico a todo instante.",
      bullets: ["Apresente as 4 etapas com confiança.", "Explique o briefing prévio de palcos e tendas.", "Garanta acompanhamento técnico contínuo em todo o processo."]
    },
    4: {
      title: "Slide 4: Caso Centrosul 2015 (Tempo: 0:45)",
      speech: "Em 2015, um painel de LED desabou no Centrosul ferindo 6 pessoas por falta de ART e alteração de projeto técnica. Nós evitamos isso fazendo a juntada das ARTs de cada item.",
      bullets: ["Conte o caso do painel de LED de uma tonelada.", "Frise a causa: montagem sem ART.", "Posicione a SC FIRE como garantia na juntada das ARTs."]
    },
    5: {
      title: "Slide 5: Ação Rápida 60 Segundos (Tempo: 0:45)",
      speech: "Enquanto o socorro oficial leva 10+ minutos para chegar, o primeiro minuto combatido por brigadistas locais salva vidas e empresas.",
      bullets: ["Explique a matemática de tempo de resposta.", "O primeiro minuto é crucial no combate de princípios.", "Valorize o treinamento de brigada local."]
    },
    6: {
      title: "Slide 6: Estruturas Temporárias - IN 24 (Tempo: 0:45)",
      speech: "Sob a IN 24, fiscalizamos rigorosamente palcos, camarotes e arquibancadas. Emitimos laudos de engenharia para evitar desabamentos estruturais.",
      bullets: ["Apresente a IN 24 do CBMSC para estruturas temporárias.", "Mencione a segurança de arquibancadas e palcos de shows.", "Enfatize a responsabilidade técnica corporativa."]
    },
    7: {
      title: "Slide 7: Planos de Emergência (Tempo: 0:45)",
      speech: "Mapeamos rotas de fuga, sinalização fotoluminescente e larguras exatas de saídas para garantir evacuações seguras e sem pânico coletivo.",
      bullets: ["Explique o cálculo de vazão de saídas de emergência.", "Apresente as sinalizações ativas de pânico.", "Mostre como evitamos aglomerações e pisoteamentos."]
    },
    8: {
      title: "Slide 8: Brigada de Prontidão (Tempo: 0:45)",
      speech: "Fornecemos brigadistas particulares altamente treinados para atuar na prevenção técnica, primeiros socorros de RCP e contenções rápidas.",
      bullets: ["Foque no treinamento dos bombeiros civis fornecidos.", "Fale sobre a prontidão no local do início ao fim.", "Destaque a capacidade de primeiros socorros."]
    },
    9: {
      title: "Slide 9: ROI em Prevenção (Tempo: 0:35)",
      speech: "Contratar a SC FIRE reduz custos em prêmios de seguro de responsabilidade civil e blinda judicialmente os diretores e organizadores.",
      bullets: ["Explique a redução de custos nos seguros de eventos.", "Mostre a blindagem judicial obtida pelas ARTs emitidas.", "Conclua que prevenir é infinitamente mais barato."]
    },
    10: {
      title: "Slide 10: Fechamento & Contato (Tempo: 0:25)",
      speech: "Lembre-se: em segurança de eventos, a sorte não é um plano de ação viável. Escaneie o QR Code, siga nosso Instagram e conte com a SC FIRE!",
      bullets: ["Aponte para o QR Code de contato.", "Bordão: A segurança que seu evento precisa, a tranquilidade que você merece!"]
    }
  },
  projetos: {
    1: {
      title: "Slide 1: Capa & Credenciais (Tempo: 0:45)",
      speech: "Bom dia, BNI! Sou Dione Borges, Engenheira Civil e Diretora Técnica da SC FIRE. Somos especialistas em PPCI predial de alta complexidade. Possuo pós-graduação em Engenharia de Segurança Contra Incêndio.",
      bullets: ["Apresente suas credenciais com postura técnica.", "Mencione ser Diretora Técnica e Especialista em Segurança Contra Incêndio.", "A tela exibirá seu extenso currículo em gestão de riscos e segurança do trabalho."]
    },
    2: {
      title: "Slide 2: Regularização & Riscos (Tempo: 0:45)",
      speech: "Operar sem Habite-se ou AVCB predial bloqueia apólices de seguro, gera multas pesadas e processos criminais severos para síndicos.",
      bullets: ["Fale do AVCB como barreira jurídica comercial.", "Mencione a perda de apólice predial em sinistros.", "Explique a responsabilidade civil do síndico."]
    },
    3: {
      title: "Slide 3: PPCI em Reformas e Layout (Tempo: 0:45)",
      speech: "Criar novas salas, erguer mezaninos ou alterar a ocupação muda o cálculo de carga de incêndio e exige atualização obrigatória do PPCI.",
      bullets: ["Explique a exigência de PPCI em reformas.", "Mudanças de divisórias afetam rotas de fuga.", "Mudança de ocupação exige readequação no CBMSC."]
    },
    4: {
      title: "Slide 4: Fluidodinâmica CFD 3D (Tempo: 0:45)",
      speech: "Aplicamos engenharia baseada em desempenho usando modelagem computacional 3D por fluidodinâmica. Isso reduz custos desnecessários em obras.",
      bullets: ["Apresente o CFD como engenharia computacional.", "Evitamos exaustores caros usando simulações físicas.", "Mostre a otimização extrema de obras."]
    },
    5: {
      title: "Slide 5: Recarga de Carro Elétrico - IN 23 (Tempo: 0:45)",
      speech: "Sob a IN 23, baterias de lítio geram calor acima de 1000°C. Projetamos exaustões virtuais sob simulações computacionais de dinâmica de fluidos.",
      bullets: ["Explique o risco de baterias de lítio em subsolos.", "Apresente as exigências técnicas da IN 23 CBMSC.", "Mostre como a SC FIRE aprova estes projetos."]
    },
    6: {
      title: "Slide 6: Dimensionamento de Hidrantes e Alarmes (Tempo: 0:45)",
      speech: "Projetamos redes hidráulicas de hidrantes, dimensionando bombas e pressões ideais. Também especificamos centrais de alarme e detecção cirúrgica contra focos de fogo.",
      bullets: ["Explique o dimensionamento de vazão e pressão em hidrantes.", "Apresente o projeto de centrais de alarme e detecção precoce.", "Mostre a blindagem predial com redes preventivas ativas."]
    },
    7: {
      title: "Slide 7: Compartimentação de Áreas (Tempo: 0:45)",
      speech: "Projetamos barreiras corta-fogo em shafts de cabos e portas corta-fogo certificadas para impedir a propagação horizontal e vertical de incêndios.",
      bullets: ["Explique o isolamento físico de chamas.", "Destaque a segurança das portas corta-fogo em escadas.", "Mostre a contenção de fumaça tóxica entre andares."]
    },
    8: {
      title: "Slide 8: Imóveis Históricos (Tempo: 0:45)",
      speech: "Aprovamos PPCI em edificações antigas ou tombadas que não possuem recuo ou escadas na norma. Usamos soluções de engenharia diagnóstica.",
      bullets: ["Mencione a complexidade de regularizar prédios históricos.", "Apresente soluções de engenharia diagnóstica customizada.", "Garantia de aprovação sem alterar estruturas protegidas."]
    },
    9: {
      title: "Slide 9: Cronograma do AVCB (Tempo: 0:35)",
      speech: "Mapeamos todas as fases: vistoria prévia de conformidade, elaboração do projeto, protocolo digital no portal CBMSC e a vistoria final.",
      bullets: ["Explique as etapas do processo de licenciamento.", "Fale sobre a agilidade digital nos portais do CBMSC.", "Acompanhamos o vistoriador até a emissão do alvará."]
    },
    10: {
      title: "Slide 10: Fechamento & Contato (Tempo: 0:25)",
      speech: "Em segurança predial, a sorte não é um plano de ação viável. Escaneie o QR Code, siga nosso Instagram e garanta a regularidade do seu prédio!",
      bullets: ["Aponte para o QR Code de contato.", "Bordão: A inteligência que seu projeto exige, a segurança que seu prédio precisa!"]
    }
  },
  treinamentos: {
    1: {
      title: "Slide 1: Capa & Credenciais (Tempo: 0:45)",
      speech: "Bom dia, BNI! Sou o Sargento Murilo Galdino, especialista e coordenador de Brigadas da SC FIRE. Nós transformamos os seus colaboradores normais na primeira e mais poderosa linha de defesa da sua empresa.",
      bullets: ["Apresente-se com voz firme de instrutor operacional.", "Mencione ser Perito de Incêndio e Membro da Coord. de Produtos Perigosos.", "A tela exibirá todas as suas credenciais acadêmicas (Química, Engenharia, Gestão)."]
    },
    2: {
      title: "Slide 2: A Exigência da IN 28 (Tempo: 0:45)",
      speech: "Se o bombeiro bater na sua indústria hoje, ele pede o PIBI - a prova de que seus funcionários sabem usar os sistemas e medidas preventivas contra incêndio e pânico. Sem isso temos sob risco o atestado de funcionamento, a segurança patrimonial e até a vida das pessoas. Nós dimensionamos o tamanho legal da sua brigada, e trazemos-na a vida.",
      bullets: ["Explique a IN 28 e a obrigatoriedade da brigada.", "Fale do PIBI nos protocolos de atestado predial.", "Dimensione brigadistas de forma legal e ideal."]
    },
    3: {
      title: "Slide 3: Teoria e Prática Realista (Tempo: 0:45)",
      speech: "Sabe aquele curso online de bombeiro que o RH compra só para ter o certificado? Na hora que o alarme toca, a equipe congela de pânico, ou corre pra salvar a sua pele. Nosso curso é imersivo e traz a experiência do combate para dentro da sala de aula.",
      bullets: ["Apresente a metodologia ativa real.", "Destaque o combate prático sob calor de verdade.", "RCP e controle de pânico corporativo."]
    },
    4: {
      title: "Slide 4: Diferenciais SC FIRE (Tempo: 0:45)",
      speech: "Nossos instrutores não são teóricos. São profissionais homologados pelo CBMSC e militares com décadas de rua. Você recebe certificação técnica inquestionável e oficial.",
      bullets: ["Valorize nossos instrutores homologados.", "Fale do credenciamento oficial na DSCI do CBMSC.", "Evite certificações online baratas e vazias."]
    },
    5: {
      title: "Slide 5: Tempo de Resposta (Tempo: 0:45)",
      speech: "O trânsito da BR não perdoa o socorro. O Corpo de Bombeiros vai demorar para chegar. É o primeiro minuto, nas mãos do seu funcionário que está no corredor, que salva a empresa de virar cinzas.",
      bullets: ["A brigada atua por 10 minutos, mas o primeiro salva tudo.", "A brigada fará a mitigação do sinistro e proteção até os bombeiros chegarem.", "O brigadista orgânico é a barreira contra incêndios."]
    },
    6: {
      title: "Slide 6: Simuladores Sustentáveis (Tempo: 0:45)",
      speech: "Treinar com a SC FIRE também é ESG. Substituímos pneus e queimas tóxicas por simuladores inovadores e sustentáveis e manequins de RCP com dispositivos de feedback e simuladores de OVACE que realmente trazem a prática para a sala de aula.",
      bullets: ["ESG: Meio Ambiente, Social e Governança.", "Destaque os dispositivos de feedback em tempo real na RCP.", "Explique o uso prático de manequins simuladores de engasgamento (OVACE)."]
    },
    7: {
      title: "Slide 7: Primeiros Socorros e Lei Lucas (Tempo: 0:45)",
      speech: "Alguém infartou na mesa ao lado. O que sua equipe faz? Nós ensinamos os primeiros socorros, manuseio de desfibriladores e manobras de desengasgamento vitais para as escolas pela Lei Lucas.",
      bullets: ["Faça uma pergunta retórica que deixe a sala pensando.", "Apresente o manuseio de colares e pranchas.", "Formação alinhada à Lei Lucas nas corporações."]
    },
    8: {
      title: "Slide 8: Simulado de Evacuação Geral (Tempo: 0:45)",
      speech: "Uma vez por ano, tocamos a sirene do seu prédio de surpresa e cronometramos. Treinamos a liderança para orquestrar a evacuação de 500 pessoas. Nossa meta é esvaziar a edificação com segurança em, no máximo, 600 segundos.",
      bullets: ["Destaque o número de 600 segundos com os dedos.", "Mostre como organizar filas rápidas e manter a calma geral.", "Auditoria interna pós-simulado de evacuação."]
    },
    9: {
      title: "Slide 9: Gestão Digital do RH (Tempo: 0:35)",
      speech: "Seu RH tem um pesadelo controlando quem venceu o curso? Na SC FIRE temos um controle e acompanhamento contínuo dos nossos clientes, sabemos quando a reciclagem do funcionário 'João' está vencendo.",
      bullets: ["Tom de alívio e inovação gerencial para o RH.", "Alertas automáticos de validades e agendamento.", "Acesso rápido aos certificados na DSCI."]
    },
    10: {
      title: "Slide 10: Fechamento (Tempo: 0:25)",
      speech: "Conectem-me aos diretores de indústrias e colégios! Treinar para não usar é infinitamente melhor do que precisar e não saber. SC FIRE: A preparação que sua equipe exige, a sobrevivência que sua empresa merece!",
      bullets: ["Aponte para o QR Code de contato.", "Dinâmico e chamando para a ação.", "Bordão final."]
    }
  },
  consultoria: {
    1: {
      title: "Slide 1: Capa & Credenciais (Tempo: 0:45)",
      speech: "Bom dia, BNI! Sou Dione Borges, Engenheira Civil e Diretora Técnica da SC FIRE. Atuamos com auditorias diagnósticas preventivas em condomínios e indústrias de grande porte.",
      bullets: ["Apresente credenciais de consultoria executiva e direção técnica.", "Apresente a auditoria como blindagem empresarial ativa."]
    },
    2: {
      title: "Slide 2: Por que Consultoria Preventiva? (Tempo: 0:45)",
      speech: "A fiscalização oficial pune de surpresa. Nossa vistoria diagnóstica preventiva caça irregularidades antes dos bombeiros para evitar embargos.",
      bullets: ["Evite o estresse de fiscalizações e lacrações surpresas.", "Mencione multas pecuniárias expressivas do Corpo de Bombeiros.", "Proteja os condomínios comerciais e residenciais."]
    },
    3: {
      title: "Slide 3: Vistoria Diagnóstica Completa (Tempo: 0:45)",
      speech: "Realizamos vistorias minuciosas em alarmes, hidrantes, sinalizações, portas corta-fogo, gás canalizado e sistemas elétricos preventivos.",
      bullets: ["Apresente a varredura física completa de instalações.", "Auditoria de portas corta-fogo, hidrantes e extintores.", "Verificação das conformidades elétricas e de gás."]
    },
    4: {
      title: "Slide 4: Laudos & Relatórios Fotográficos (Tempo: 0:45)",
      speech: "Geramos Laudos Técnicos assinados por engenheiros com relatórios de não-conformidades. Um guia sem rodeios para sua manutenção predial.",
      bullets: ["Apresente o laudo técnico com ART assinada.", "O relatório fornece bússola clara para a equipe predial.", "Blindagem judicial direta para o síndico e diretores."]
    },
    5: {
      title: "Slide 5: Renovação Digital do Atestado (Tempo: 0:45)",
      speech: "Assumimos 100% da burocracia digital nos portais do CBMSC. Agendamos e acompanhamos o vistoriador oficial no dia até emitir o alvará.",
      bullets: ["Fim da burocracia digital nos portais do Corpo de Bombeiros.", "Agendamos e acompanhamos o vistoriador oficial no condomínio.", "Entrega do alvará finalizado em suas mãos."]
    },
    6: {
      title: "Slide 6: Auditorias Semestrais (Tempo: 0:45)",
      speech: "Criamos rotinas de inspeção proativa a cada seis meses. Isso garante que todos os equipamentos estejam operacionais durante o ano todo.",
      bullets: ["Rotina semestral preventiva de manutenção ativa.", "Testes práticos de detecção e alarmes periódicos.", "Substituição e manutenção antes de falhas reais ocorrerem."]
    },
    7: {
      title: "Slide 7: Sensores de Alarme e Detecção (Tempo: 0:45)",
      speech: "Auditamos o tempo de resposta de sensores endereçáveis e centrais de alarmes, garantindo detecção precoce em subsolos e shafts.",
      bullets: ["Apresente o teste de sensores ópticos e térmicos.", "Conformidade das botoeiras e centrais de incêndio.", "Foco em prevenção contra princípios ocultos de fogo."]
    },
    8: {
      title: "Slide 8: Hidrantes e Bombas de Incêndio (Tempo: 0:45)",
      speech: "Medimos a pressão dinâmica nas caixas de incêndio e realizamos testes hidrostáticos em mangueiras para evitar vazamentos em emergências.",
      bullets: ["Explique os testes de vazão e pressão dinâmica.", "Garante mangueiras desobstruídas e sem rachaduras.", "Manutenção ativa da bomba principal elétrica e de pressurização."]
    },
    9: {
      title: "Slide 9: Mitigação de Riscos de Seguros (Tempo: 0:35)",
      speech: "A auditoria técnica da SC FIRE reduz o valor da franquia das apólices corporativas e garante o pagamento integral em caso de sinistros.",
      bullets: ["Negociação de seguros baseada em conformidade predial.", "Redução de custos anuais de apólices condominiais.", "Garantia de segurança máxima de reembolso."]
    },
    10: {
      title: "Slide 10: Fechamento & Contato (Tempo: 0:25)",
      speech: "Em grandes estruturas comerciais, prevenir ativamente é a única apólice real de sobrevivência. Chame a SC FIRE Consultoria!",
      bullets: ["Aponte para o QR Code de contato.", "Bordão: A conformidade que seu imóvel exige, a tranquilidade que você merece!"]
    }
  }
};

const SLIDE_TARGETS_CUMULATIVE = [45, 90, 135, 180, 225, 270, 315, 360, 395, 420, 440];

function UnifiedApresentacaoPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("classId");
  const [isPending, startTransition] = useTransition();

  /* ═══ Core Main Cockpit States ═══ */
  const [classes, setClasses] = useState<ClassFromDB[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [activeClass, setActiveClass] = useState<ClassFromDB | null>(null);

  /* ═══ URL Class Autoselect ═══ */
  useEffect(() => {
    if (classIdParam && classes.length > 0 && !activeClass) {
      const match = classes.find((c) => c.id === classIdParam);
      if (match) {
        setActiveClass(match);
        if (match.interaction_mode) {
          setInteractionMode(match.interaction_mode);
        }
      }
    }
  }, [classIdParam, classes, activeClass]);

  const [subthemes, setSubthemes] = useState<Subtheme[]>([]);
  const [loadingSubthemes, setLoadingSubthemes] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);

  const [interactionMode, setInteractionMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState<"canva" | "pdf">("canva");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Class Timer
  const [initialSeconds, setInitialSeconds] = useState(0);
  const classTimer = useTimer(initialSeconds, activeClass?.status === "em_andamento");

  const completedCount = subthemes.filter((s) => s.completed).length;
  const progressPercent = subthemes.length > 0 ? Math.round((completedCount / subthemes.length) * 100) : 0;
  const activeSubtheme = subthemes[activeIndex];

  /* ═══ Core BNI Cockpit States ═══ */
  const [activeDeck, setActiveDeck] = useState<"eventos" | "projetos" | "treinamentos" | "consultoria" | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(420); // 7 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const slideContentRef = useRef<HTMLDivElement>(null);
  const bniTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ═══ Fetch Classes ═══ */
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id, status, qr_code_token, scheduled_at, started_at,
          company:companies(name),
          training:trainings(id, name, total_hours)
        `)
        .in("status", ["agendada", "em_andamento"])
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setClasses((data as any[]) || []);
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
    } finally {
      setLoadingClasses(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  /* ═══ Fetch Subthemes when Class Selected ═══ */
  const fetchSubthemes = useCallback(async (trainingId: string) => {
    setLoadingSubthemes(true);
    try {
      const { data, error } = await supabase
        .from("training_subthemes")
        .select(`
          sort_order, is_mandatory,
          subtheme:subthemes(id, name, hours, level, category, canva_embed, description)
        `)
        .eq("training_id", trainingId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Subtheme[] = data.map((row: any, i) => ({
          id: row.subtheme.id,
          title: row.subtheme.name,
          duration: `${row.subtheme.hours}h`,
          completed: i < activeIndex,
          canva_embed: row.subtheme.canva_embed,
          category: row.subtheme.category,
          level: row.subtheme.level,
          description: row.subtheme.description,
        }));
        setSubthemes(mapped);
      } else {
        setSubthemes([]);
      }
    } catch (err) {
      console.error("Erro ao buscar subtemas:", err);
    } finally {
      setLoadingSubthemes(false);
    }
  }, [supabase, activeIndex]);

  useEffect(() => {
    if (activeClass) {
      fetchSubthemes(activeClass.training.id);

      if (activeClass.started_at) {
        const start = new Date(activeClass.started_at).getTime();
        const now = new Date().getTime();
        const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
        setInitialSeconds(diffSeconds);
      } else {
        setInitialSeconds(0);
      }
    }
  }, [activeClass, fetchSubthemes]);

  /* ═══ Sync Active Subtheme to Supabase ═══ */
  useEffect(() => {
    if (activeClass && activeClass.status === "em_andamento" && subthemes.length > 0) {
      const subthemeId = subthemes[activeIndex]?.id;
      if (subthemeId) {
        supabase
          .from("classes")
          .update({ active_subtheme_id: subthemeId })
          .eq("id", activeClass.id)
          .then(({ error }) => {
            if (error) console.error("Erro ao sincronizar subtema no Supabase:", error);
          });
      }
    }
  }, [activeIndex, subthemes, activeClass, supabase]);

  /* ═══ Sync Interaction Mode to Supabase ═══ */
  useEffect(() => {
    if (activeClass && activeClass.status === "em_andamento") {
      supabase
        .from("classes")
        .update({ interaction_mode: interactionMode })
        .eq("id", activeClass.id)
        .then(({ error }) => {
          if (error) console.error("Erro ao atualizar modo de interação no Supabase:", error);
        });
    }
  }, [interactionMode, activeClass, supabase]);

  /* ═══ Fetch Attendances (Polling 5s) ═══ */
  const fetchAttendances = useCallback(async () => {
    if (!activeClass) return;
    try {
      const { data, error } = await supabase
        .from("attendances")
        .select(`
          checked_in_at,
          student:students(full_name, email, cpf)
        `)
        .eq("class_id", activeClass.id)
        .order("checked_in_at", { ascending: false });

      if (error) throw error;
      setAttendances((data as any[]) || []);
    } catch (err) {
      console.error("Erro ao buscar presenças:", err);
    }
  }, [supabase, activeClass]);

  useEffect(() => {
    if (activeClass && activeClass.status === "em_andamento") {
      fetchAttendances();
      const interval = setInterval(fetchAttendances, 5000);
      return () => clearInterval(interval);
    }
  }, [activeClass, fetchAttendances]);

  /* ═══ Start Class Action ═══ */
  const startClass = async () => {
    if (!activeClass) return;
    startTransition(async () => {
      try {
        const startTime = new Date().toISOString();
        const { error } = await supabase
          .from("classes")
          .update({
            status: "em_andamento",
            started_at: startTime,
          })
          .eq("id", activeClass.id);

        if (error) throw error;

        setActiveClass((prev) =>
          prev
            ? {
                ...prev,
                status: "em_andamento",
                started_at: startTime,
              }
            : null
        );
        classTimer.setRunning(true);
      } catch (err) {
        console.error("Erro ao iniciar turma:", err);
      }
    });
  };

  /* ═══ Finish Class Action ═══ */
  const finishClass = async () => {
    if (!activeClass) return;
    const confirm = window.confirm("Deseja realmente finalizar esta aula? Isso registrará a conclusão oficial no banco de dados.");
    if (!confirm) return;

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("classes")
          .update({
            status: "concluida",
            finished_at: new Date().toISOString(),
          })
          .eq("id", activeClass.id);

        if (error) throw error;
        router.push("/instrutor/dashboard");
      } catch (err) {
        console.error("Erro ao finalizar turma:", err);
      }
    });
  };

  const goToSubtheme = useCallback(
    (index: number) => {
      if (index >= 0 && index < subthemes.length) {
        setActiveIndex(index);
        setLibraryOpen(false);

        setSubthemes((prev) =>
          prev.map((sub, i) => ({
            ...sub,
            completed: i < index,
          }))
        );
      }
    },
    [subthemes.length]
  );

  /* Build QR Code Links */
  const qrCodeUrl = useMemo(() => {
    if (typeof window === "undefined" || !activeClass) return "";
    const origin = window.location.origin;
    return `${origin}/aluno/check-in?token=${activeClass.qr_code_token}`;
  }, [activeClass]);

  const avaliacaoUrl = useMemo(() => {
    if (typeof window === "undefined" || !activeClass) return "";
    const origin = window.location.origin;
    return `${origin}/aluno/avaliacao?token=${activeClass.qr_code_token}`;
  }, [activeClass]);

  /* Keyboard shortcuts for Classes */
  useEffect(() => {
    if (activeClass?.status !== "em_andamento") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Usar Shift + Setas para pular de subtema, para não roubar o controle do passador de slides (que usa Setas simples)
      if (e.shiftKey && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
        e.preventDefault();
        goToSubtheme(Math.min(activeIndex + 1, subthemes.length - 1));
      } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        e.preventDefault();
        goToSubtheme(Math.max(activeIndex - 1, 0));
      } else if (e.key === "Escape") {
        setLibraryOpen(false);
        setQrModalOpen(false);
        setAvaliacaoModalOpen(false);
      } else if (e.key === "b" || e.key === "B" || e.key === ".") {
        // Botão "Tela Preta" do passador de slides (B ou Ponto) para avançar matéria
        e.preventDefault();
        goToSubtheme(Math.min(activeIndex + 1, subthemes.length - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, goToSubtheme, subthemes.length, activeClass]);

  /* Build QR Code Link */
  const getCheckInUrl = () => {
    if (!activeClass) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/aluno/check-in?token=${activeClass.qr_code_token}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getCheckInUrl());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  /* ═══ Keyboard Event Listeners for BNI navigation ═══ */
  useEffect(() => {
    if (!activeDeck) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          nextBniSlide();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevBniSlide();
          break;
        case "p":
        case "P":
          e.preventDefault();
          setNotesOpen((o) => !o);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setIsTestMode((t) => !t);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, currentSlideIndex]);

  /* ═══ Handle BNI Timer Tick ═══ */
  useEffect(() => {
    if (!isRunning) {
      if (bniTimerIntervalRef.current) clearInterval(bniTimerIntervalRef.current);
      return;
    }

    const speed = isTestMode ? 100 : 1000;
    bniTimerIntervalRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (bniTimerIntervalRef.current) clearInterval(bniTimerIntervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, speed);

    return () => {
      if (bniTimerIntervalRef.current) clearInterval(bniTimerIntervalRef.current);
    };
  }, [isRunning, isTestMode]);

  /* ═══ Dynamic Responsive Scaling Engine (Fit-to-Screen) for BNI ═══ */
  const adjustBniScale = () => {
    const slideContent = slideContentRef.current;
    if (!slideContent) return;

    const isMobile = window.innerWidth <= 768;
    const baseWidth = 1200;
    const baseHeight = 680;
    
    const paddingX = isMobile ? 30 : 180;
    const paddingY = isMobile ? 80 : 120;

    let availableWidth = window.innerWidth - paddingX;
    let availableHeight = window.innerHeight - paddingY;

    if (notesOpen && !isMobile) {
      availableWidth -= 420;
    }

    if (window.innerWidth <= 1200) {
      slideContent.style.transform = "none";
      return;
    }

    let scale;
    scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
    scale = Math.max(scale, 0.35);
    scale = Math.min(scale, 1.1);

    slideContent.style.transform = `scale(${scale})`;
    slideContent.style.transformOrigin = "center center";
  };

  useEffect(() => {
    if (activeDeck) {
      adjustBniScale();
      window.addEventListener("resize", adjustBniScale);
      return () => window.removeEventListener("resize", adjustBniScale);
    }
  }, [activeDeck, currentSlideIndex, notesOpen]);

  useEffect(() => {
    if (activeDeck) {
      const intervals = [50, 150, 300, 450];
      intervals.forEach((ms) => {
        setTimeout(adjustBniScale, ms);
      });
    }
  }, [notesOpen]);

  /* ═══ Core BNI Slide Navigation Actions ═══ */
  const nextBniSlide = () => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, activeDeck === "eventos" ? 10 : 9));
  };

  const prevBniSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSelectBniDeck = (deck: "eventos" | "projetos" | "treinamentos" | "consultoria") => {
    setActiveDeck(deck);
    setCurrentSlideIndex(0);
    setTimeRemaining(420);
    setIsRunning(true);
  };

  const handleExitBniDeck = () => {
    setActiveDeck(null);
    setIsRunning(false);
    setIsTestMode(false);
  };

  /* ═══ BNI Pacing calculations ═══ */
  const getBniPaceStatus = () => {
    const elapsedSeconds = 420 - timeRemaining;
    const targetEnd = SLIDE_TARGETS_CUMULATIVE[currentSlideIndex];
    const targetStart = currentSlideIndex === 0 ? 0 : SLIDE_TARGETS_CUMULATIVE[currentSlideIndex - 1];
    const buffer = 15;

    if (elapsedSeconds < targetStart - buffer) {
      return { text: "Adiantado", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
    } else if (elapsedSeconds > targetEnd + buffer) {
      return { text: "Atrasado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } else {
      return { text: "No Ritmo", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
  };

  const pace = getBniPaceStatus();
  const bniMinutes = Math.floor(timeRemaining / 60);
  const bniSeconds = timeRemaining % 60;
  const bniProgressPercentage = (timeRemaining / 420) * 100;
  
  const bniActiveNote = activeDeck ? SPEAKER_NOTES[activeDeck][currentSlideIndex + 1] : null;

  /* ═══════════════════════════════════════════════════
     VIEW 1: MODO BNI APRESENTAÇÃO ATIVO
     ═══════════════════════════════════════════════════ */
  if (activeDeck) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090a0e] text-white flex flex-col font-sans overflow-hidden bni-presentation-mode">
        {/* Glowing Background */}
        <div className="absolute inset-0 bg-[#090a0e] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/[0.03] blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
        </div>

        {/* TOP HEADER */}
        <header className="h-[80px] bg-[#0c0d12]/90 border-b border-white/[0.05] flex items-center justify-between px-6 flex-shrink-0 relative z-30 backdrop-blur-md">
          <div className="pain-header">
            <span className="text-2xl font-black text-red-500 tracking-tighter">SC</span>
            <span className="text-2xl font-black text-white tracking-tighter">FIRE</span>
            <span
              className={`px-3 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                activeDeck === "eventos"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : activeDeck === "projetos"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : activeDeck === "treinamentos"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/20"
              }`}
            >
              {activeDeck === "eventos" ? "Eventos" : activeDeck === "projetos" ? "SC FIRE 1:1" : activeDeck === "treinamentos" ? "Treinamentos" : "Consultoria"}
            </span>
          </div>

          {/* BNI Timer System */}
          <div className="flex flex-col items-center max-w-[280px] md:max-w-[320px] w-full bg-[#13151b] border border-white/[0.06] rounded-xl px-4 py-2 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 h-[2px] bg-red-500 transition-all duration-1000" style={{ width: `${bniProgressPercentage}%` }} />
            <div className="flex items-center justify-between w-full z-10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold font-mono tracking-wider">
                  {String(bniMinutes).padStart(2, "0")}:{String(bniSeconds).padStart(2, "0")}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${pace.color}`}>
                {pace.text}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="pain-header">
            <button
              onClick={handleExitBniDeck}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all font-semibold text-xs text-gray-300 hover:text-white"
              title="Mudar Apresentação (Voltar ao Seletor)"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Mudar Canal</span>
            </button>
            
            <button
              onClick={() => setIsTestMode((t) => !t)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border transition-all font-semibold text-xs ${
                isTestMode 
                  ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                  : "bg-white/[0.04] border-white/[0.08] hover:border-white/20 text-gray-300 hover:text-white"
              }`}
              title="Acelerar tempo do cronômetro para testes"
            >
              <span className="hidden sm:inline">10x Teste</span>
              <span className="sm:hidden">10x</span>
            </button>

            <button
              onClick={() => setNotesOpen((o) => !o)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border transition-all font-semibold text-xs ${
                notesOpen 
                  ? "bg-primary/20 border-primary text-primary" 
                  : "bg-white/[0.04] border-white/[0.08] hover:border-white/20 text-gray-300 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notas (P)</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTAINER */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          <main className="flex-1 flex items-center justify-center relative p-6 overflow-hidden">
            <div
              ref={slideContentRef}
              className="w-[1200px] h-[680px] min-w-[1200px] min-h-[680px] flex-shrink-0 bg-[#0c0d12] border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col items-center justify-center p-0 transition-all duration-300 select-none"
            >
              {/* Orbs inside box */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/[0.02] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

              {/* BNI Slide 1: Cover Slide */}
              {currentSlideIndex === 0 && (
                <div className="slide-content cover-slide text-center flex flex-col items-center justify-center w-full h-full">
                  <div className="fire-badge animate-slide-up">
                    {activeDeck === "eventos" ? (
                      <>
                        <PartyPopper className="w-4 h-4 text-primary" />
                        <span>Desde 2012 — Origem no Planeta Atlântida</span>
                      </>
                    ) : activeDeck === "projetos" ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Engenharia de Prevenção & Projetos</span>
                      </>
                    ) : activeDeck === "treinamentos" ? (
                      <>
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <span>Formação de Diário de Segurança</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 text-sky-400" />
                        <span>Auditoria Técnica & Consultoria</span>
                      </>
                    )}
                  </div>

                  <h1 className="main-title">
                    {activeDeck === "eventos" ? (
                      <>
                        A Segurança que seu Evento Precisa, <span className="text-red-500">a Tranquilidade que você Merece</span>
                      </>
                    ) : activeDeck === "projetos" ? (
                      <>
                        A Inteligência que seu Projeto Exige, <span className="text-amber-500">a Segurança que sua Edificação Precisa</span>
                      </>
                    ) : activeDeck === "treinamentos" ? (
                      <>
                        A Preparação que sua Equipe Exige, <span className="text-emerald-500">a Tranquilidade que você Merece</span>
                      </>
                    ) : (
                      <>
                        A Conformidade que seu Imóvel Exige, <span className="text-sky-400">a Segurança que seu Negócio Merece</span>
                      </>
                    )}
                  </h1>

                  <p className="subtitle">
                    {activeDeck === "eventos" && "Nascemos em um dos maiores festivals do sul do país. Conheça nosso ecossistema de soluções preventivas baseadas na IN 24."}
                    {activeDeck === "projetos" && "Desatamos a burocracia do Corpo de Bombeiros através de engenharia preventiva e projetos técnicos contra incêndio de alto desempenho."}
                    {activeDeck === "treinamentos" && "Formação e Reciclagem Técnica de Brigadas Corporativas Orgânicas em estrita conformidade legal com a IN 28 do CBMSC."}
                    {activeDeck === "consultoria" && "Blindamos síndicos prediais e proprietários comerciais contra fiscalizações inesperadas de segurança contra incêndio."}
                  </p>

                  {/* Paulo Ramos Presenter Avatar on Cover for Eventos */}
                  {activeDeck === "eventos" && (
                    <div className="presenter-badge-cover mt-4">
                      <div className="presenter-badge-avatar">
                        <img src="/apresentador.png" alt="Paulo Roberto Ramos" className="presenter-badge-img" />
                        <div className="presenter-badge-glow" />
                      </div>
                      <div className="presenter-badge-info">
                        <h4 className="font-bold text-sm text-white text-left font-display">Paulo Roberto Ramos</h4>
                        <div className="flex flex-col gap-0.5 text-[11px] text-gray-300 text-left mt-1 leading-tight">
                          <p>
                            Gestor de Seg. Corporativa e Contra Incêndio | <span className="text-red-400 font-semibold">Experiência em Segurança desde 1996</span>
                          </p>
                          <p className="text-gray-400">
                            Formação acadêmica: Gestão de Segurança Empresarial, Pós-Graduação com Especialização em Segurança Corporativa
                          </p>
                          <p className="text-gray-400">
                            Pós-graduação com Esp. em Gestão de Seg. Contra Incêndio | Instrutor Credenciado no BM e PF
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dione Borges Presenter Avatar on Cover for Projetos */}
                  {activeDeck === "projetos" && (
                    <div className="presenter-badge-cover mt-4">
                      <div className="presenter-badge-avatar">
                        <img src="/dione.png" alt="Dione Borges" className="presenter-badge-img" />
                        <div className="presenter-badge-glow" />
                      </div>
                      <div className="presenter-badge-info">
                        <h4 className="font-bold text-sm text-white text-left font-display">Dione Borges</h4>
                        <div className="flex flex-col gap-0.5 text-[11px] text-gray-300 text-left mt-1 leading-tight">
                          <p>
                            Engenheira Civil | <span className="text-amber-400 font-semibold">Diretora Técnica da SC FIRE Engenharia</span>
                          </p>
                          <p className="text-gray-400">
                            Pós-Graduada em Engenharia de Segurança Contra Incêndio e Pânico
                          </p>
                          <p className="text-gray-400">
                            Pós-Graduada em Engenharia de Segurança do Trabalho | Pós-Graduanda em Gestão de Riscos e Desastres
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sgt Murilo Presenter Avatar on Cover for Treinamentos */}
                  {activeDeck === "treinamentos" && (
                    <div className="presenter-badge-cover mt-4">
                      <div className="presenter-badge-avatar">
                        <img src="/murilo.png" alt="Sargento BM Murilo Galdino" className="presenter-badge-img" />
                        <div className="presenter-badge-glow" />
                      </div>
                      <div className="presenter-badge-info">
                        <h4 className="font-bold text-sm text-white text-left font-display">Sargento BM Murilo Galdino</h4>
                        <div className="flex flex-col gap-0.5 text-[11px] text-gray-300 text-left mt-1 leading-tight">
                          <p>
                            Sargento Bombeiro Militar | <span className="text-amber-400 font-semibold">Perito de Incêndio</span> | Membro da Coord. de Produtos Perigosos (Radioatividade)
                          </p>
                          <p className="text-gray-400">
                            <span className="text-white font-semibold">Coordenador Pedagógico SC FIRE</span> | Licenciatura em Ciências da Natureza (Química)
                          </p>
                          <p className="text-gray-400">
                            Pós-Graduado em Gestão de Processos | Graduando em Eng. Mecânica
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cover Grid Pillars */}
                  <div className="portfolio-umbrella">
                    <div className="portfolio-card">
                      <div className="pcard-icon-wrapper">
                        {activeDeck === "eventos" ? <PartyPopper className="w-5 h-5" /> : activeDeck === "projetos" ? <FileCheck2 className="w-5 h-5" /> : activeDeck === "treinamentos" ? <Users className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                      </div>
                      <h3 >{activeDeck === "eventos" ? "EVENTOS (IN 24)" : activeDeck === "projetos" ? "PPCI Predial" : activeDeck === "treinamentos" ? "Brigadas Orgânicas" : "Pré-Vistoria Diagnóstica"}</h3>
                      <p >
                        {activeDeck === "eventos" && "Projetos temporários, vistorias estruturais rápidas e Brigadistas sob a IN 24."}
                        {activeDeck === "projetos" && "Elaboração de Projetos Preventivos para condomínios e indústrias."}
                        {activeDeck === "treinamentos" && "Capacitação obrigatória de colaboradores locais (IN 28) para controle de pânico."}
                        {activeDeck === "consultoria" && "Auditoria de conformidade predial sob as 35 Instruções Normativas."}
                      </p>
                    </div>

                    <div className="portfolio-card">
                      <div className="pcard-icon-wrapper">
                        {activeDeck === "eventos" ? <FileText className="w-5 h-5" /> : activeDeck === "projetos" ? <Award className="w-5 h-5" /> : activeDeck === "treinamentos" ? <ShieldCheck className="w-5 h-5" /> : <FileCheck2 className="w-5 h-5" />}
                      </div>
                      <h3 >{activeDeck === "eventos" ? "PROJETOS" : activeDeck === "projetos" ? "Regularização (AVCB)" : activeDeck === "treinamentos" ? "Brigadistas Particulares" : "Laudos & Pareceres"}</h3>
                      <p >
                        {activeDeck === "eventos" && "Elaboração e aprovação de PPCI e Habite-se de edificações prediais."}
                        {activeDeck === "projetos" && "Protocolo digital rápido para Habite-se predial e alvarás dos bombeiros."}
                        {activeDeck === "treinamentos" && "Formação técnica e reciclagens homologadas para atuação comercial dedicada."}
                        {activeDeck === "consultoria" && "Atestados de gás, alarmes de incêndio, portas corta-fogo e geradores."}
                      </p>
                    </div>

                    <div className="portfolio-card">
                      <div className="pcard-icon-wrapper">
                        {activeDeck === "eventos" ? <GraduationCap className="w-5 h-5" /> : activeDeck === "projetos" ? <Sliders className="w-5 h-5" /> : activeDeck === "treinamentos" ? <Activity className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                      </div>
                      <h3 >{activeDeck === "eventos" ? "TREINAMENTOS" : activeDeck === "projetos" ? "Alto Desempenho" : activeDeck === "treinamentos" ? "Primeiros Socorros" : "Renovação Simplificada"}</h3>
                      <p >
                        {activeDeck === "eventos" && "Capacitação técnica de brigadas orgânicas internas e primeiros socorros."}
                        {activeDeck === "projetos" && "Estudos de fluidodinâmica 3D por supercomputadores (CFD)."}
                        {activeDeck === "treinamentos" && "RCP teórico-prático homologado de acordo com a Lei Lucas."}
                        {activeDeck === "consultoria" && "Assessoria digital burocrática para licenciamento anual sem multas."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 2 (NOVO): Nossa Origem & Propulsores (Planeta Atlântida 2012 & Copa 2014) */}
              {currentSlideIndex === 1 && activeDeck === "eventos" && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center animate-fade-in">
                  <div className="section-tag warning-tag">
                    <History className="w-4 h-4" />
                    <span>Nossa Origem</span>
                  </div>

                  <h2 className="slide-title">
                    Nascidos nos Grandes Palcos: <span className="text-amber-500 font-display">Os Dois Eventos Propulsores</span>
                  </h2>

                  <div className="grid grid-cols-2 gap-8 w-full">
                    {/* Text and highlights of the two events */}
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between text-left h-[300px]">
                      <div className="space-y-4">
                        <div className="flex gap-3 items-start text-xs text-gray-300">
                          <Flame className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-white mb-0.5">1. Planeta Atlântida (2012)</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Onde nossa história começou. Atuamos na gestão preventiva de riscos operacionais de um dos maiores festivais de música e entretenimento do país, lidando com milhares de pessoas diariamente.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start text-xs text-gray-300 pt-2">
                          <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-white mb-0.5">2. Copa do Mundo FIFA (2014)</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              A consolidação da nossa excelência técnica. Fomos peça fundamental na segurança operacional e no suporte médico de emergência do estádio durante o megaevento global da FIFA em Porto Alegre.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-fit">
                        <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Autoridade técnica testada nas maiores escalas possíveis.</span>
                      </div>
                    </div>

                    {/* Photo display */}
                    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0d12] overflow-hidden shadow-2xl flex flex-col justify-center items-center h-[300px]">
                      <img src="/copa_2014.png" alt="Paulo Roberto Ramos na Copa do Mundo 2014" className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 text-center z-10">
                        <span className="text-xs font-semibold text-white font-display">Paulo Roberto Ramos na Copa do Mundo de 2014</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 2: Setor / Dores / Exigências */}
              {((currentSlideIndex === 1 && activeDeck !== "eventos") || (currentSlideIndex === 2 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center">
                  <div className="section-tag warning-tag">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{activeDeck === "eventos" ? "Força do Setor" : activeDeck === "projetos" ? "Segurança Jurídica" : activeDeck === "treinamentos" ? "Conformidade Legal" : "Por que Consultoria?"}</span>
                  </div>

                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>O Impacto Gigante do <span className="text-red-500">Turismo de Eventos em Floripa</span></>}
                    {activeDeck === "projetos" && <>Por que Regularizar? <span className="text-amber-500">Riscos e Sanções Inesperadas</span></>}
                    {activeDeck === "treinamentos" && <>A Exigência Técnica da <span className="text-emerald-400 font-display">Instrução Normativa 28</span></>}
                    {activeDeck === "consultoria" && <>A Auditoria Preventiva: <span className="text-sky-400">Aja Antes da Fiscalização</span></>}
                  </h2>

                  <div className="grid-2col">
                    <div className="pain-card stats-card">
                      <div className="pain-header">
                        <Coins className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">{activeDeck === "eventos" ? "Serviços em Floripa" : activeDeck === "projetos" ? "O Escudo do Alvará" : activeDeck === "treinamentos" ? "Plano de Implantação (PIBI)" : "Conformidade Antecipada"}</h3>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {activeDeck === "eventos" && "Em Florianópolis, o turismo e o trade de eventos deixaram de ser apenas uma atividade de lazer de verão para se tornarem uma indústria bilionária."}
                        {activeDeck === "projetos" && "Possuir o AVCB ou Habite-se em dia blinda a sua empresa perante fiscalizações prediais de rotina."}
                        {activeDeck === "treinamentos" && "Sob a IN 28 do Corpo de Bombeiros (CBMSC), a regularidade predial exige a constituição da brigada orgânica corporativa."}
                        {activeDeck === "consultoria" && "Não espere a vistoria oficial surpresa de rotina dos oficiais bombeiros ou seguradoras prediais para consertar pendências."}
                      </p>
                      <div className="quick-facts">
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "76,1%" : activeDeck === "projetos" ? "100% Legal" : activeDeck === "treinamentos" ? "PIBI Exigido" : "Varredura"}</span>
                          <span className="fact-label">{activeDeck === "eventos" ? "Do PIB Municipal gerado pelo Setor de Serviços." : activeDeck === "projetos" ? "Total conformidade contra multas de fiscalização predial." : activeDeck === "treinamentos" ? "Obrigatório o protocolo digital no CBMSC para renovar atestado." : "Inspeção cirúrgica prévia em mais de 35 normas preventivas."}</span>
                        </div>
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "R$ 4 Bilhões" : activeDeck === "projetos" ? "Seguro Ativo" : activeDeck === "treinamentos" ? "Brigadistas" : "Segurança"}</span>
                          <span className="fact-label">{activeDeck === "eventos" ? "Injetados por ano na economia de Floripa pelo trade de eventos, sustentando milhares de famílias o ano inteiro." : activeDeck === "projetos" ? "Garante total liquidez securitária em caso de sinistro." : activeDeck === "treinamentos" ? "Dimensione e prepare o número ideal de funcionários." : "Fim do estresse de multas ou lacração surpresa das portas."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pain-card">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        As Dores e Custos da Falha Preventiva
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        A ausência de prevenção profissional ativa gera consequências severas que paralisam negócios e eventos na véspera da abertura:
                      </p>
                      <ul className="pain-list">
                        {[
                          "Embargos e lacrações surpresas aplicadas na véspera do seu evento ou funcionamento comercial.",
                          "Processos criminais e responsabilidade civil direta sobre os organizadores, síndicos e gestores em caso de incidentes.",
                          "Quebra irreversível de reputação de marca e recusa total de cobertura financeira de seguradoras.",
                        ].map((pain, pIdx) => (
                          <li key={pIdx} className="flex gap-2 items-start text-xs text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                            <span className="leading-tight">{pain}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 3: Flow do trabalho */}
              {((currentSlideIndex === 2 && activeDeck !== "eventos") || (currentSlideIndex === 3 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center">
                  <div className="section-tag success-tag animate-slide-up">
                    <GitCommit className="w-4 h-4" />
                    <span>O Fluxo</span>
                  </div>

                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>O Flow do Nosso Trabalho: <span className="gradient-text">Da Análise à Operação</span></>}
                    {activeDeck === "projetos" && <>O Flow do Nosso Trabalho: <span className="gradient-text red-grad">Da Análise ao Habite-se</span></>}
                    {activeDeck === "treinamentos" && <>O Método do Nosso Trabalho: <span className="gradient-text red-grad">Da Análise à Homologação</span></>}
                    {activeDeck === "consultoria" && <>O Flow da Nossa Consultoria: <span className="gradient-text blue-grad">Do Diagnóstico ao Alvará</span></>}
                  </h2>
                  <p className="slide-desc">
                    Desenvolvemos um fluxo inteligente que cuida de toda a segurança jurídica e operacional da SC FIRE.
                  </p>

                  <div className="workflow-timeline">
                    <div className="timeline-line"></div>
                    
                    {[
                      { icon: ClipboardSignature, step: "Fase 1: Mapeamento", title: activeDeck === "eventos" ? "Briefing Técnico" : activeDeck === "projetos" ? "Vistoria Diagnóstica" : activeDeck === "treinamentos" ? "Análise de Riscos" : "Vistoria Prévia", desc: activeDeck === "eventos" ? "Estudo de lotação, rotas de fuga e vistorias de palcos." : activeDeck === "projetos" ? "Coleta de dados da edificação e layouts físicos locais." : activeDeck === "treinamentos" ? "Avaliação predial sob a IN 28 e dimensionamento." : "Inspeção dos hidrantes, saídas de emergência, alarmes e rotas." },
                      { icon: FileCheck2, step: "Fase 2: Projeto", title: activeDeck === "eventos" ? "Documentação Ágil" : activeDeck === "projetos" ? "Projetos em CAD" : activeDeck === "treinamentos" ? "Conteúdo Programático" : "Roteiro Técnico", desc: activeDeck === "eventos" ? "Montagem técnica rápida de projetos e ARTs junto ao CBMSC." : activeDeck === "projetos" ? "Desenho técnico preventivo completo e dimensionamento de rotas." : activeDeck === "treinamentos" ? "Planejamento didático teórico-prático personalizado." : "Geração de Laudo Técnico detalhado sem rodeios." },
                      { icon: Users, step: "Fase 3: Protocolo", title: activeDeck === "eventos" ? "Dimensionamento" : activeDeck === "projetos" ? "Protocolo CBMSC" : activeDeck === "treinamentos" ? "Treinamento Realista" : "Trâmite Preventivo", desc: activeDeck === "eventos" ? "Escala precisa e legal de brigada de bombeiros civis." : activeDeck === "projetos" ? "Acompanhamento digital burocrático de análises do órgão." : activeDeck === "treinamentos" ? "Uso de fogo real e RCP massagem prática assistida." : "Varredura de conformidades de gás e extintores." },
                      { icon: ShieldCheck, step: activeDeck === "eventos" ? "Fase 4: Todo o Processo" : "Fase 4: Operação", title: activeDeck === "eventos" ? "Acompanhamento Técnico" : activeDeck === "projetos" ? "Vistoria & Alvará" : activeDeck === "treinamentos" ? "Homologação" : "Habite-se Concedido", desc: activeDeck === "eventos" ? "Acompanhamento técnico em todo o processo (não apenas no dia) e brigada na prevenção ativa." : activeDeck === "projetos" ? "Acompanhamento de vistorias técnicas até alvará na mão." : activeDeck === "treinamentos" ? "Emissão de certificados na DSCI/CBMSC de forma ágil." : "Entrega do atestado do CBMSC renovado sem multas." }
                    ].map((stepObj, sIdx) => {
                      const IconComponent = stepObj.icon;
                      return (
                        <div key={sIdx} className="timeline-step">
                          <div className="step-num">0{sIdx + 1}</div>
                          <div className="step-card">
                            <IconComponent className="step-icon" />
                            <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-widest block">{stepObj.step}</span>
                            <h4>{stepObj.title}</h4>
                            <p>{stepObj.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BNI Slide 4: Case Centrosul (Eventos), CFD Simulation Grid (Projetos), Diferenciais (Treinamentos) ou Laudos (Consultoria) */}
              {((currentSlideIndex === 3 && activeDeck !== "eventos") || (currentSlideIndex === 4 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center">
                  {activeDeck === "projetos" ? (
                    <>
                      {/* CFD 1:1 Special Grid Simulation */}
                      <div className="section-tag info-tag animate-pulse">
                        <Sliders className="w-4 h-4" />
                        <span>Fluidodinâmica CFD em Ação</span>
                      </div>

                      <h2 className="slide-title">
                        Engenharia Computacional 3D: <span className="text-amber-500">Projeto Baseado em Desempenho</span>
                      </h2>

                      <div className="grid-2col">
                        {/* Simulation Screen */}
                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#06070a] h-[300px] overflow-hidden flex items-center justify-center group shadow-2xl">
                          <div className="absolute inset-0 grid-mesh opacity-20 pointer-events-none" />
                          <div className="absolute inset-0 m-auto w-[90%] h-[80%] border border-dashed border-amber-500/15 rounded-xl flex items-center justify-center">
                            <span className="text-[10px] text-amber-500/40 uppercase tracking-widest font-mono absolute top-4">Simulation Room: Garage_Sub_Floor_3</span>
                            <span className="text-[10px] text-amber-500/40 uppercase tracking-widest font-mono absolute bottom-4">CFD ACTIVE MODELING</span>
                            {/* Scanning laser line */}
                            <div className="absolute left-0 right-0 h-[2px] bg-amber-500/60 shadow-[0_0_12px_#f59e0b] animate-laser z-10" />
                            {/* Static CFD diagram vector */}
                            <svg className="w-56 h-56 text-amber-500/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" />
                              <path d="M20 100H180" stroke="currentColor" strokeWidth="2" />
                              <path d="M100 20V180" stroke="currentColor" strokeWidth="2" />
                              <path d="M50 50L150 150" stroke="currentColor" strokeWidth="1" />
                              <path d="M150 50L50 150" stroke="currentColor" strokeWidth="1" />
                            </svg>
                          </div>
                        </div>

                        {/* Text explanation */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between text-left h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">Alternativa Científica de Economia de Obras</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              A Engenharia de Desempenho utiliza modelagem computacional 3D por supercomputadores para avaliar o trajeto real de gases tóxicos e calor.
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>Evita obras físicas civis que custariam centenas de milhares em exaustores desnecessários.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>Garante total respaldo legal e aprovação junto às diretorias técnicas de grandes metrópoles.</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">SC FIRE ENGENHARIA — EFICIÊNCIA DE PONTAS</span>
                        </div>
                      </div>
                    </>
                  ) : activeDeck === "eventos" ? (
                    <>
                      {/* Case Centrosul (Eventos) */}
                      <div className="section-tag warning-tag">
                        <AlertOctagon className="w-4 h-4" />
                        <span>Aprender com a História</span>
                      </div>

                      <h2 className="slide-title">
                        Estudo de Caso: <span className="text-red-500">O Acidente do Centrosul em 2015</span>
                      </h2>

                      <div className="case-box">
                        {/* Newspaper/Accident visual mockup */}
                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-6 overflow-hidden shadow-2xl flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest">Notícia Oficial — Florianópolis</span>
                            <h4 className="text-lg font-bold text-white leading-tight font-display">Desabamento de Painel de LED fere 6 pessoas em Centro de Eventos</h4>
                            <p>
                              Um painel de LED pesando **1 tonelada** desabou de uma altura de 5 metros durante a montagem de um congresso nacional no Centrosul, ferindo gravemente seis trabalhadores técnicos locais.
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/[0.05] pt-3">
                            <span>Fonte: Imprensa Local (2015)</span>
                            <span className="font-extrabold text-red-500/60 uppercase">PPCI INCOMPLETO</span>
                          </div>
                        </div>

                        {/* Analysis of cause and prevention */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">As Causas Técnicas da Tragédia</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              A investigação revelou que a estrutura do palco foi alterada de última hora sem avaliação prévia de engenheiro responsável e sem projeto preventivo do Corpo de Bombeiros (AVCB temporário).
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>Montagem improvisada de alta tonelagem sem ART de responsabilidade.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>**Ação SC FIRE:** Fazemos a juntada das ARTs de cada item, exigimos conformidade técnica e mantemos brigadas ativas no local.</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">A PREVENÇÃO SALVA VIDAS E REPUTAÇÕES</span>
                        </div>
                      </div>
                    </>
                  ) : activeDeck === "treinamentos" ? (
                    <>
                      {/* Diferenciais SC FIRE (Treinamentos) */}
                      <div className="section-tag warning-tag">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Diferenciais SC FIRE</span>
                      </div>

                      <h2 className="slide-title">
                        Nosso Padrão de Ensino: <span className="gradient-text red-grad">Diferenciais Extraordinários</span>
                      </h2>

                      <div className="case-box">
                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-6 overflow-hidden shadow-2xl flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Instrutores de Elite & Pista</span>
                            <h4 className="text-lg font-bold text-white leading-tight font-display">Instrutores Homologados & Pista de Fogo Real</h4>
                            <p className="text-xs text-gray-300">
                              Nossas aulas práticas são coordenadas por engenheiros de segurança contra incêndio e bombeiros experientes credenciados na DSCI/CBMSC. Realizamos treinamentos de combate em pistas especializadas sob calor real para quebrar o pânico da sua equipe.
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/[0.05] pt-3">
                            <span>Selo de Qualidade SC FIRE</span>
                            <span className="font-extrabold text-amber-500/60 uppercase">100% HOMOLOGADO</span>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">Treinamento Corporativo Sério</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Não vendemos certificados rápidos e vazios pela internet. Capacitamos sua equipe para salvar vidas prediais de verdade e manter a regularidade total do PIBI.
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>Simulador ativo de fogo na pista real.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>Controle de pânico e evasões prediais coordenadas por especialistas do CBMSC.</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">A DIFERENÇA ENTRE O SUSTO E A CONCEPÇÃO</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Laudos & Relatórios Fotográficos (Consultoria) */}
                      <div className="section-tag info-tag">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span>Laudos de Engenharia</span>
                      </div>

                      <h2 className="slide-title">
                        Laudos & Pareceres Técnicos: <span className="gradient-text blue-grad">Bússola de Conformidade</span>
                      </h2>

                      <div className="case-box">
                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-6 overflow-hidden shadow-2xl flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest">Guia Sem Rodeios</span>
                            <h4 className="text-lg font-bold text-white leading-tight font-display">Relatório Fotográfico Detalhado de Conformidade</h4>
                            <p className="text-xs text-gray-300">
                              Entregamos um dossiê técnico de não-conformidades prediais com relatórios fotográficos explícitos. Apontamos tudo o que precisa ser ajustado na edificação antes dos bombeiros realizarem a vistoria oficial de renovação.
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/[0.05] pt-3">
                            <span>Selo de Prevenção Consultiva</span>
                            <span className="font-extrabold text-sky-500/60 uppercase">ART DE ENGENHARIA</span>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left flex flex-col justify-between h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">Blindagem da Administração</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Todo laudo técnico emitido pela SC FIRE Consultoria é assinado por engenheiro de segurança com ART oficial predial, servindo de escudo jurídico para o síndico civilmente.
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                                <span>Acompanhamento dos testes e correções prediais preventivas.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                                <span>Dossiê Bússola que guia a manutenção interna com eficiência extrema.</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">A SEGURANÇA QUE SEU IMÓVEL PRECISA, A TRANQUILIDADE MERECIDA</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}


                            {/* BNI Slide 5: Ação 60 Segundos (Eventos/Treinamentos/Consultoria) ou SAVE Bateria de Lítio (Projetos) */}
              {((currentSlideIndex === 4 && activeDeck !== "eventos") || (currentSlideIndex === 5 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center">
                  {activeDeck === "projetos" ? (
                    <>
                      {/* Lithium battery thermal CFD simulation model */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold max-w-fit uppercase tracking-wider animate-pulse">
                        <BatteryCharging className="w-4 h-4" />
                        <span>Carros Elétricos — Risco Térmico IN 23</span>
                      </div>

                      <h2 className="text-3xl font-extrabold tracking-tight text-white font-display text-left">
                        Segurança em Pontos de Recarga: <span className="text-amber-500">Simulação de Bateria Coletiva</span>
                      </h2>

                      <div className="grid grid-cols-2 gap-8 w-full">
                        {/* Simulation Screen */}
                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#06070a] h-[300px] overflow-hidden flex items-center justify-center group shadow-2xl">
                          <div className="absolute inset-0 grid-mesh opacity-20 pointer-events-none" />
                          <div className="absolute inset-0 m-auto w-[90%] h-[80%] border border-dashed border-amber-500/15 rounded-xl flex items-center justify-center">
                            <span className="text-[10px] text-amber-500/40 uppercase tracking-widest font-mono absolute top-4">IN 23 SAVE - Lithium Thermal Test</span>
                            
                            {/* Scanning laser line */}
                            <div className="absolute left-0 right-0 h-[2px] bg-sky-400/60 shadow-[0_0_12px_#38bdf8] animate-laser z-10" />

                            {/* Simulated smoke puff elements */}
                            <div className="absolute bottom-[-10px] left-[15%] w-36 h-36 bg-white/[0.03] rounded-full blur-xl animate-smoke-1" />
                            <div className="absolute bottom-[-10px] left-[45%] w-40 h-40 bg-white/[0.04] rounded-full blur-xl animate-smoke-2" />
                            <div className="absolute bottom-[-10px] right-[15%] w-32 h-32 bg-white/[0.03] rounded-full blur-xl animate-smoke-3" />

                            {/* Battery design icon with red glowing pulse */}
                            <div className="flex flex-col items-center space-y-3 relative z-20">
                              <div className="w-32 h-16 rounded-xl border-4 border-white/20 bg-white/5 relative flex items-center justify-center shadow-inner overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 bg-red-600/30 animate-thermal-pulse" style={{ width: "70%" }} />
                                <span className="text-red-500 font-bold font-mono text-sm animate-pulse">65°C CRITICAL</span>
                              </div>
                              <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest font-mono">BATERIA LÍTIO ACTIVE</span>
                            </div>
                          </div>
                        </div>

                        {/* Text explanation */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between text-left h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">Instrução Normativa 23 do CBMSC</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Baterias de carros elétricos em subsolos geram fumaça extremamente tóxica e calor superior a 1000°C.
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>A SC FIRE projeta sistemas automatizados de controle de dispersão de calor e fumaça em garagens.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>Total conformidade com o regramento mais moderno do Corpo de Bombeiros (SAVE).</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">SC FIRE — CONSULTORIA TÉCNICA DE ALTO DESEMPENHO</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Slide 5: Response Time display (Eventos / Treinamentos / Consultoria) */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold max-w-fit uppercase tracking-wider">
                        <Activity className="w-4 h-4" />
                        <span>Matemática do Tempo de Resposta</span>
                      </div>

                      <h2 className="text-3xl font-extrabold tracking-tight text-white font-display text-left">
                        Ação Rápida em 60 Segundos: <span className="text-emerald-400">Como Evitamos Tragédias</span>
                      </h2>

                      <div className="grid grid-cols-2 gap-8 w-full">
                        {/* Simulation Screen */}
                        <div className="cfd-response-display w-full">
                          <div className="response-timeline">
                            <div className="response-node node-brigade">
                              <div className="flex justify-between items-center w-full">
                                <span className="node-label">Brigada Orgânica SC FIRE</span>
                                <span className="node-badge-time">01 min (Ação)</span>
                              </div>
                              <div className="node-bar-container">
                                <div className="node-bar bar-green" style={{ width: "20%" }} />
                              </div>
                              <span className="node-status text-green text-left">Princípio de incêndio controlado na origem.</span>
                            </div>

                            <div className="response-node node-bombeiros">
                              <div className="flex justify-between items-center w-full">
                                <span className="node-label">Bombeiros Oficiais (Tempo Médio)</span>
                                <span className="node-badge-time">10+ min (Caminhão)</span>
                              </div>
                              <div className="node-bar-container">
                                <div className="node-bar bar-red" style={{ width: "100%" }} />
                              </div>
                              <span className="node-status text-red text-left">Grandes estragos estruturais e risco severo.</span>
                            </div>
                          </div>
                        </div>

                        {/* Text explanation */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between text-left h-[300px]">
                          <div className="space-y-4">
                            <h3 className="text-base font-bold text-white">Por que Treinar Colaboradores?</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Devido ao trânsito, o tempo de resposta do caminhão oficial pode ultrapassar 10 minutos. O primeiro minuto combatido localmente decide o futuro patrimonial e humano da edificação.
                            </p>
                            <div className="space-y-3.5 pt-2">
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>A brigada é treinada para atuar por **10 minutos**, mas é o **primeiro deles** que vai fazer a diferença entre o sucesso e o desastre.</span>
                              </div>
                              <div className="flex gap-2 items-start text-xs text-gray-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>Até a chegada do Corpo de Bombeiros a brigada vai fazer a mitigação do sinistro e a proteção contínua das pessoas.</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">A SUA EQUIPE COMO ESCUDO PREVENTIVO ATIVO</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* BNI Slide 6 (NOVO): Aprofundamento Pilar A (Tempo: 0:45) */}
              {((currentSlideIndex === 5 && activeDeck !== "eventos") || (currentSlideIndex === 6 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center animate-fade-in">
                  <div className="section-tag warning-tag">
                    <Sliders className="w-4 h-4" />
                    <span>{activeDeck === "eventos" ? "Estruturas Temporárias" : activeDeck === "projetos" ? "Hidrantes e Alarmes" : activeDeck === "treinamentos" ? "Tecnologia Ecológica" : "Auditorias Periódicas"}</span>
                  </div>
                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>Estruturas e Segurança em Grandes Shows: <span className="gradient-text">IN 24</span></>}
                    {activeDeck === "projetos" && <>Dimensionamento de Redes Preventivas: <span className="gradient-text red-grad">Hidrantes e Alarmes</span></>}
                    {activeDeck === "treinamentos" && <>Treinamento Sustentável e Tecnológico: <span className="gradient-text red-grad">Simuladores Sustentáveis</span></>}
                    {activeDeck === "consultoria" && <>Inspeções Técnicas Semestrais: <span className="gradient-text blue-grad">Varreduras Proativas</span></>}
                  </h2>
                  <div className="grid-2col">
                    <div className="pain-card">
                      <h3 className="font-bold text-lg text-white">
                        {activeDeck === "eventos" ? "Vistorias de Palcos e Tendas" : activeDeck === "projetos" ? "Cálculo de Vazão & Alarmes" : activeDeck === "treinamentos" ? "Simuladores Sustentáveis & Feedback" : "Checklist Físico Geral"}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {activeDeck === "eventos" && "Palcos monumentais e arquibancadas exigem vistorias estruturais diárias e cálculo estrito de carga máxima."}
                        {activeDeck === "projetos" && "Projetos hidráulicos detalhados de tubulações de incêndio, perda de carga hidráulica, vazão exata de bombas e posicionamento estratégico de alarmes."}
                        {activeDeck === "treinamentos" && "Combatemos chamas com simuladores inovadores e sustentáveis, aliados a manequins de RCP com dispositivos de feedback eletrônico em tempo real e simuladores de OVACE (engasgo)."}
                        {activeDeck === "consultoria" && "Auditorias minuciosas programadas duas vezes ao ano evitam o acúmulo de inconformidades e blindam a administração."}
                      </p>
                      <div className="quick-facts mt-2">
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "100% ART" : activeDeck === "projetos" ? "Hidráulico" : activeDeck === "treinamentos" ? "Feedback" : "Prevenção"}</span>
                          <span className="fact-label">
                            {activeDeck === "eventos" ? "Garantia de engenharia assinada em todas as montagens." : activeDeck === "projetos" ? "Determinação exata da força e diâmetros de canos contra rompimentos." : activeDeck === "treinamentos" ? "Mapeamento eletrônico instantâneo da profundidade e ritmo das compressões de reanimação." : "Detecção e contenção imediata de pendências prediais."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-center space-y-3">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                        O Ponto Chave da SC FIRE
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {activeDeck === "eventos" && "Não deixamos montadores improvisarem. Exigimos projetos técnicos e ARTs estruturais de engenheiros credenciados."}
                        {activeDeck === "projetos" && "Garantimos o posicionamento correto das botoeiras e centrais de alarme prediais com ART de engenharia homologada."}
                        {activeDeck === "treinamentos" && "**ESG (Meio Ambiente, Social e Governança):** Substituímos fumaça e queimas poluentes por simuladores sustentáveis limpos, garantindo conformidade com a responsabilidade corporativa e eficácia cirúrgica de resgate."}
                        {activeDeck === "consultoria" && "Substituímos e reparamos peças preventivamente antes da quebra, eliminando surpresas na vistoria oficial."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 7 (NOVO): Aprofundamento Pilar B (Tempo: 0:45) */}
              {((currentSlideIndex === 6 && activeDeck !== "eventos") || (currentSlideIndex === 7 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center animate-fade-in">
                  <div className="section-tag success-tag">
                    <Activity className="w-4 h-4" />
                    <span>{activeDeck === "eventos" ? "Fluxo e Escapes" : activeDeck === "projetos" ? "Barreiras Físicas" : activeDeck === "treinamentos" ? "Primeiro Socorro" : "Sistemas Alarme"}</span>
                  </div>
                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>Dimensionamento de Rotas e Escapes Ativos: <span className="gradient-text">Evasão Segura</span></>}
                    {activeDeck === "projetos" && <>Compartimentação Física de Áreas: <span className="gradient-text red-grad">Corta-Fogo</span></>}
                    {activeDeck === "treinamentos" && <>Formação Prática em Primeiros Socorros: <span className="gradient-text red-grad">Primeiros Socorros</span></>}
                    {activeDeck === "consultoria" && <>Centrais e Sensores Endereçáveis: <span className="gradient-text blue-grad">Detecção Cirúrgica</span></>}
                  </h2>
                  <div className="grid-2col">
                    <div className="pain-card">
                      <h3 className="font-bold text-lg text-white">
                        {activeDeck === "eventos" ? "Cálculo de Fluxo de Lotação" : activeDeck === "projetos" ? "Isolamento Corta-Fogo em Shafts" : activeDeck === "treinamentos" ? "Imobilização e Colar Cervical" : "Sinalização e Detecção Endereçável"}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {activeDeck === "eventos" && "Planejamento dinâmico de saídas de emergência e corredores livres calculados com base no público máximo."}
                        {activeDeck === "projetos" && "Portas corta-fogo homologadas e selagens resistentes a chamas em aberturas de passagens elétricas condominiais."}
                        {activeDeck === "treinamentos" && "Técnicas de pranchamento rígido de fraturas e colocação de colares de imobilização para quedas prediais."}
                        {activeDeck === "consultoria" && "Testes de fumaça reais nos detectores e auditoria operacional das centrais endereçáveis da edificação."}
                      </p>
                      <div className="quick-facts mt-2">
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "Saídas" : activeDeck === "projetos" ? "4 Horas" : activeDeck === "treinamentos" ? "Lei Lucas" : "Sensores"}</span>
                          <span className="fact-label">
                            {activeDeck === "eventos" ? "Larguras de passagem otimizadas contra aglomerações e pânico." : activeDeck === "projetos" ? "Tempo de contenção física de chamas certificado em portas." : activeDeck === "treinamentos" ? "Atendimento inicial rápido e obrigatório em escolas e indústrias." : "Localização exata de princípios no painel central endereçável."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-center space-y-3">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                        <Building2 className="w-4 h-4 text-red-500" />
                        A Diferença SC FIRE
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {activeDeck === "eventos" && "Desenhamos rotas de fuga fotoluminescentes ativas, sinalizando claramente saídas mesmo em blecaute."}
                        {activeDeck === "projetos" && "Garantimos compartimentação total de cabos, impedindo que a fumaça de incêndio invada escadas ou elevadores."}
                        {activeDeck === "treinamentos" && "Alinhamos os treinamentos de primeiros socorros às regras legais e práticas da CLT e da Secretaria de Educação (Lei Lucas)."}
                        {activeDeck === "consultoria" && "Limpamos e calibramos sensores ópticos de detecção periodicamente para evitar falsos alarmes prediais."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 8 (NOVO): Aprofundamento Pilar C (Tempo: 0:45) */}
              {((currentSlideIndex === 7 && activeDeck !== "eventos") || (currentSlideIndex === 8 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center animate-fade-in">
                  <div className="section-tag info-tag">
                    <Award className="w-4 h-4" />
                    <span>{activeDeck === "eventos" ? "Brigada Dedicada" : activeDeck === "projetos" ? "Engenharia Histórica" : activeDeck === "treinamentos" ? "Plano Prático" : "Hidráulica Activa"}</span>
                  </div>
                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>O Papel do Brigadista Particular em Shows: <span className="gradient-text">Efetivo de Elite</span></>}
                    {activeDeck === "projetos" && <>Prédios Tombados e Imóveis Antigos: <span className="gradient-text red-grad">Soluções Especiais</span></>}
                    {activeDeck === "treinamentos" && <>Coordenação Geral de Simulados: <span className="gradient-text red-grad">Abandono de Área</span></>}
                    {activeDeck === "consultoria" && <>Testes de Hidrantes e Mangueiras: <span className="gradient-text blue-grad">Força Dinâmica</span></>}
                  </h2>
                  <div className="grid-2col">
                    <div className="pain-card">
                      <h3 className="font-bold text-lg text-white">
                        {activeDeck === "eventos" ? "Prevenção Operacional e Socorrismo" : activeDeck === "projetos" ? "PPCI Baseado em Desempenho Histórico" : activeDeck === "treinamentos" ? "Simulação Coordenada Anual de Abandono" : "Pressão de Bombas e Hidrostática"}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {activeDeck === "eventos" && "Bombeiros civis dedicados caçando riscos ativamente no evento e realizando atendimentos iniciais."}
                        {activeDeck === "projetos" && "Aprovação de projetos preventivos em edificações tombadas ou antigas sem recuo através de Engenharia de Desempenho."}
                        {activeDeck === "treinamentos" && "Organização de evacuações cronometradas com toda a população do condomínio residencial ou empresa."}
                        {activeDeck === "consultoria" && "Medição da pressão dinâmica nos hidrantes mais desfavoráveis e testes hidrostáticos de mangueiras prediais."}
                      </p>
                      <div className="quick-facts mt-2">
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "Resgate" : activeDeck === "projetos" ? "Legado" : activeDeck === "treinamentos" ? "600 Seg." : "Pressão"}</span>
                          <span className="fact-label">
                            {activeDeck === "eventos" ? "Atuação técnica contínua sob o menor tempo de resposta no local." : activeDeck === "projetos" ? "Adequação sem mexer ou danificar a arquitetura tombada." : activeDeck === "treinamentos" ? "Meta de evacuação rápida de no máximo 600 segundos obtida após treino de liderança." : "Garantia de vazão e hidrantes sem rachaduras operacionais."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-center space-y-3">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                        <Warehouse className="w-4 h-4 text-red-500" />
                        O Selo SC FIRE
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {activeDeck === "eventos" && "Nossos profissionais são bombeiros civis com reciclagens técnicas ativas e controle tático sob calor real."}
                        {activeDeck === "projetos" && "Aprovamos PPCI em edificações tombadas usando PBD sem descaracterizar a edificação histórica."}
                        {activeDeck === "treinamentos" && "Ensinamos o líder de brigada de cada andar a comandar a evasão mantendo a população calma e segura."}
                        {activeDeck === "consultoria" && "Realizamos testes de estanqueidade física e pressão hidrostática sob laudo fotográfico com ART oficial."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 9 (NOVO): Benefício / Financeiro / Cronograma (Tempo: 0:35) */}
              {((currentSlideIndex === 8 && activeDeck !== "eventos") || (currentSlideIndex === 9 && activeDeck === "eventos")) && (
                <div className="slide-content text-left w-full h-full flex flex-col justify-center animate-fade-in">
                  <div className="section-tag referral-tag">
                    <Coins className="w-4 h-4" />
                    <span>{activeDeck === "eventos" ? "Retorno e Prevenção" : activeDeck === "projetos" ? "Cronograma e Prazos" : activeDeck === "treinamentos" ? "Validação e Validade" : "Mitigação Seguros"}</span>
                  </div>
                  <h2 className="slide-title">
                    {activeDeck === "eventos" && <>Retorno de Investimento em Segurança: <span className="gradient-text">Proteção Ativa</span></>}
                    {activeDeck === "projetos" && <>Fases e Prazos do Licenciamento CBMSC: <span className="gradient-text red-grad">AVCB Sem Dores</span></>}
                    {activeDeck === "treinamentos" && <>Portal SC FIRE de Controle Técnico: <span className="gradient-text red-grad">Gestão Inteligente</span></>}
                    {activeDeck === "consultoria" && <>Mitigação de Riscos de Seguros Prediais: <span className="gradient-text blue-grad">Apólices Blindadas</span></>}
                  </h2>
                  <div className="grid-2col">
                    <div className="pain-card">
                      <h3 className="font-bold text-lg text-white">
                        {activeDeck === "eventos" ? "Evite Custos Brutais de Embargos" : activeDeck === "projetos" ? "Transparência Total no Cronograma" : activeDeck === "treinamentos" ? "Facilidade de Controle para RH" : "Redução Drástica na Franquia"}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {activeDeck === "eventos" && "Prevenir com a SC FIRE evita o cancelamento completo do show e a responsabilização civil de diretores."}
                        {activeDeck === "projetos" && "Dividimos o processo em etapas claras: vistoria, elaboração técnica do PPCI, aprovação e vistoria final."}
                        {activeDeck === "treinamentos" && "Temos um CONTROLE E ACOMPANHAMENTO CONTÍNUO DOS NOSSOS CLIENTES, SABEMOS quando a reciclagem do funcionário 'João' está vencendo."}
                        {activeDeck === "consultoria" && "Manter laudos e ARTs preventivas anuais assegura o pagamento de indenização integral de seguradoras."}
                      </p>
                      <div className="quick-facts mt-2">
                        <div className="fact-item">
                          <span className="fact-number">{activeDeck === "eventos" ? "ROI" : activeDeck === "projetos" ? "Etapas" : activeDeck === "treinamentos" ? "RH Ativo" : "Liquidez"}</span>
                          <span className="fact-label">
                            {activeDeck === "eventos" ? "Segurança jurídica que reduz custos de seguros corporativos de eventos." : activeDeck === "projetos" ? "Prazos do Corpo de Bombeiros controlados digitalmente." : activeDeck === "treinamentos" ? "Controle automatizado de reciclagens sem preocupações prediais." : "Garantia técnica de conformidade predial sem cortes securitários."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-center space-y-3">
                      <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                        <HeartHandshake className="w-4 h-4 text-red-500" />
                        O Compromisso SC FIRE
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {activeDeck === "eventos" && "Reduzimos a franquia e blindamos a organização de shows perante o CBMSC de ponta a ponta."}
                        {activeDeck === "projetos" && "Montamos vistorias realistas de conformidade antes de solicitar a vistoria do Corpo de Bombeiros."}
                        {activeDeck === "treinamentos" && "Geramos certificados válidos na DSCI do CBMSC de forma rápida e digital sem complicações."}
                        {activeDeck === "consultoria" && "Garantimos conformidade em mais de 35 normas preventivas, blindando o síndico predial."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BNI Slide 10 (MIGRAD0): Final Slide / Contacts & References (Anteriormente Slide 6) */}
              {((currentSlideIndex === 9 && activeDeck !== "eventos") || (currentSlideIndex === 10 && activeDeck === "eventos")) && (
                <div className="slide-content final-slide text-center flex flex-col items-center justify-center w-full h-full animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Parceria de Confiança</span>
                  </div>

                  <h2 className="final-headline">SC FIRE</h2>
                  <p className="final-tagline">"A segurança que seu negócio precisa, a tranquilidade que você merece!"</p>
                  
                  <div className="contact-box">
                    {/* Left Column - Dynamic Presenter Information */}
                    <div className="presenter-card-final">
                      {activeDeck !== "consultoria" ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="presenter-avatar-wrapper shadow-lg">
                            <img
                              src={activeDeck === "projetos" ? "/dione.png" : activeDeck === "treinamentos" ? "/murilo.png" : "/apresentador.png"}
                              alt="Apresentador"
                              className="presenter-avatar"
                            />
                            <div className="absolute inset-0 bg-fire-gradient opacity-20 pointer-events-none" />
                          </div>
                          <div className="presenter-title text-center">
                            <h4 className="font-bold text-sm text-white">
                              {activeDeck === "projetos" ? "Dione Borges" : activeDeck === "treinamentos" ? "Sargento BM Murilo Galdino" : "Paulo Roberto Ramos"}
                            </h4>
                            <p className="text-[10px] text-gray-400 leading-normal">
                              {activeDeck === "projetos" ? "Engenheira Civil & PPCI" : activeDeck === "treinamentos" ? "Especialista em Brigadas & Treinamentos" : "Especialista Operacional & Diretor"}
                            </p>
                            {(activeDeck === "projetos" || activeDeck === "treinamentos") && (
                              <p className="text-[8px] text-amber-400 font-extrabold uppercase tracking-wider mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                                Membro da Sociedade Brasileira de Engenharia de Segurança Contra Incêndio
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          {/* 3 mini cards side-by-side for Consultoria */}
                          <div className="flex gap-4">
                            {["/apresentador.png", "/dione.png", "/murilo.png"].map((img, i) => (
                              <div key={i} className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg shadow-primary/20 bg-white/5 relative">
                                <img src={img} alt="Consultor" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          <div className="presenter-title">
                            <h4 className="font-bold text-sm text-white">Equipe Multidisciplinar</h4>
                            <p className="text-[10px] text-gray-400">Auditores Especialistas</p>
                            <span className="inline-flex mt-1 text-[8px] font-bold tracking-widest text-amber-400 border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">Referência Técnica</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center Column - Instagram QR code */}
                    <div className="qr-code-zone">
                      <a
                        href="https://www.instagram.com/sc.fire.engenharia/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="qr-link"
                      >
                        <div className="qr-inner">
                          <img src="/qrcode.png" alt="QR Code Instagram" className="w-full h-full object-contain" />
                          <div className="qr-center-icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                          </div>
                        </div>
                      </a>
                      <span className="text-[10px] text-gray-400 font-semibold">Escaneie para seguir</span>
                    </div>

                    {/* Right Column - Contact Commercial details */}
                    <div className="contact-details">
                      <div className="contact-item">
                        <div className="contact-icon">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h5 className="text-[10px] text-gray-400 font-semibold uppercase">WhatsApp Comercial</h5>
                          <p className="text-xs font-bold text-white">(48) 99141-2186</p>
                        </div>
                      </div>

                      <div className="contact-item">
                        <div className="contact-icon">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h5 className="text-[10px] text-gray-400 font-semibold uppercase">Portal Oficial</h5>
                          <p className="text-xs font-bold text-white">scfire.com.br</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation overlay buttons (Placed outside the scaled slide box, relative to the main screen viewport) */}
            <button
              onClick={prevBniSlide}
              disabled={currentSlideIndex === 0}
              className={`absolute left-8 z-30 p-4 rounded-full border border-white/[0.08] bg-[#0c0d12]/80 text-gray-400 hover:text-white hover:border-white/35 transition-all shadow-2xl backdrop-blur-md ${currentSlideIndex === 0 ? "opacity-30 pointer-events-none" : "hover:scale-105 active:scale-95"}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextBniSlide}
              disabled={currentSlideIndex === (activeDeck === "eventos" ? 10 : 9)}
              className={`absolute right-8 z-30 p-4 rounded-full border border-white/[0.08] bg-[#0c0d12]/80 text-gray-400 hover:text-white hover:border-white/35 transition-all shadow-2xl backdrop-blur-md ${currentSlideIndex === (activeDeck === "eventos" ? 10 : 9) ? "opacity-30 pointer-events-none" : "hover:scale-105 active:scale-95"}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </main>

          {/* RIGHT DRAWER: Speaker Notes */}
          <aside
            className={`
              w-[420px] bg-[#0c0d12] border-l border-white/[0.05] flex flex-col flex-shrink-0 relative z-20 transition-all duration-300 ease-in-out
              ${notesOpen ? "mr-0" : "-mr-[420px] pointer-events-none opacity-0"}
            `}
          >
            <div className="h-14 border-b border-white/[0.05] flex items-center justify-between px-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Notas do Apresentador</span>
              </h3>
              <button
                onClick={() => setNotesOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {bniActiveNote ? (
                <>
                  <div className="space-y-2 text-left">
                    <h4 className="text-xs font-extrabold text-red-500 uppercase tracking-wider">
                      {bniActiveNote.title}
                    </h4>
                    <p className="text-xs font-bold text-white leading-relaxed bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                      {bniActiveNote.speech}
                    </p>
                  </div>

                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                      Dicas e Bulletpoints Focados
                    </h5>
                    <ul className="space-y-2.5">
                      {bniActiveNote.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-300 leading-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 italic text-left">Selecione um slide para ver as anotações faladas.</p>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.05] bg-[#090a0e] text-center text-[10px] text-gray-500 font-semibold tracking-wider">
              Obrigado, equipe BNI! SC FIRE.
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW 2: UNIFIED SPLIT-SCREEN WELCOME PAGE
     ═══════════════════════════════════════════════════ */
  if (!activeClass) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#090a0e] relative overflow-hidden px-6 py-12 bni-presentation-mode">
        {/* Glow decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/2 blur-[100px]" />

        <div className="relative z-10 w-full max-w-2xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">Central de Transmissão de Aulas</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Selecione o Roteiro da Transmissão
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">
              Selecione uma das turmas ativas ou agendadas abaixo para dar início oficial e abrir a interface de slides.
            </p>
          </div>

          {/* classes box */}
          <div className="glass rounded-3xl p-6 border border-white/[0.05] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="pain-header flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-white">Turmas & Instruções</h3>
                  <p className="text-xs text-gray-400">Aulas ativas e agendadas com os alunos</p>
                </div>
              </div>

              {loadingClasses ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Buscando turmas...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl space-y-4">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Nenhuma turma ativa ou agendada cadastrada no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setActiveClass(cls)}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-between cursor-pointer group text-left"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="text-sm font-bold text-white truncate">{cls.company?.name || "Batalhão / Seção"}</h4>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                          <span className="truncate">{cls.training?.name}</span>
                          {cls.scheduled_at && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                              <span className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-primary" />
                                {new Date(cls.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/instrutor/dashboard")}
              className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-primary hover:text-white transition-all text-xs font-bold text-gray-300"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW 3: TURMA AGENDADA (TELA DE ESPERA)
     ═══════════════════════════════════════════════════ */
  if (activeClass.status === "agendada") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background relative overflow-hidden px-6">
        <button
          onClick={() => setActiveClass(null)}
          className="absolute top-6 right-6 p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors z-20"
          title="Voltar para seleção"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-xl text-center space-y-8 glass rounded-2xl p-8 border border-border shadow-2xl">
          <div className="relative inline-flex mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-warning/20 flex items-center justify-center shadow-lg text-warning animate-float">
              <Clock className="w-10 h-10" />
            </div>
            <div className="absolute -inset-2 bg-warning rounded-2xl opacity-10 blur-xl animate-pulse-glow" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Aguardando Início da Aula</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Você selecionou a turma da empresa **{activeClass.company?.name}** para o treinamento **{activeClass.training?.name}**.
              <br />
              Clique no botão abaixo para dar início oficial. Isso notificará o sistema e abrirá o roteiro do apresentador Canva.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border/50 text-left space-y-2.5 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Empresa:</span>
              <span className="font-semibold text-foreground">{activeClass.company?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Curso:</span>
              <span className="font-semibold text-foreground">{activeClass.training?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Carga Horária:</span>
              <span className="font-semibold text-foreground">{activeClass.training?.total_hours} horas</span>
            </div>
          </div>

          <button
            onClick={startClass}
            disabled={isPending}
            className="w-full max-w-xs h-12 rounded-xl bg-fire-gradient-strong text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/45 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 mx-auto disabled:opacity-75 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando Turma...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Iniciar Treinamento
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW 4: COCKPIT PRINCIPAL (AULA EM ANDAMENTO)
     ═══════════════════════════════════════════════════ */
  return (
    <div className={`flex flex-col h-dvh overflow-hidden bg-background text-foreground select-none relative ${isPending ? "opacity-75 pointer-events-none" : ""}`}>
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">AULA ATIVA</span>
          </div>

          <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-lg bg-surface border border-border text-left">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{activeClass.company?.name}</span>
            <span className="text-border flex-shrink-0">|</span>
            <GraduationCap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">{activeClass.training?.name}</span>
          </div>
        </div>

        {/* Timer, status and finalize */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">{attendances.length} alunos</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface border border-border">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold font-mono tracking-wider">{classTimer.formatted}</span>
          </div>

          <button
            onClick={finishClass}
            className="h-9 px-4 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors text-xs font-bold shadow-md shadow-destructive/10"
          >
            Finalizar Aula
          </button>
          
          <button
            onClick={() => setActiveClass(null)}
            className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground transition-all"
            title="Voltar para seleção"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Subthemes list */}
        <aside
          className={`
            bg-card border-r border-border flex flex-col flex-shrink-0 z-10 transition-all duration-300 ease-in-out relative
            ${sidebarCollapsed ? "w-0 -translate-x-full pointer-events-none opacity-0" : "w-72"}
          `}
        >
          {/* Progress Section */}
          <div className="p-5 border-b border-border bg-surface/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Progresso Técnico</span>
              <span className="text-xs font-extrabold text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-fire-gradient-strong transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2">
              <span>{completedCount} concluídos</span>
              <span>{subthemes.length - completedCount} restantes</span>
            </div>
          </div>

          {/* Subtheme Scroll list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingSubthemes ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Carregando ementa...</p>
              </div>
            ) : subthemes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">Nenhum subtema associado.</p>
            ) : (
              subthemes.map((sub, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={sub.id}
                    onClick={() => goToSubtheme(idx)}
                    className={`
                      w-full p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden group
                      ${
                        isActive
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/5"
                          : sub.completed
                            ? "bg-surface/40 border-border text-muted-foreground hover:bg-surface/70"
                            : "bg-card border-border hover:border-primary/20 hover:bg-surface/20"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3 relative z-10 text-left">
                      <div
                        className={`
                          w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-[10px] font-bold transition-all
                          ${
                            isActive
                              ? "bg-primary border-primary text-white"
                              : sub.completed
                                ? "bg-[#22c55e] border-[#22c55e] text-white"
                                : "bg-surface border-border text-muted-foreground"
                          }
                        `}
                      >
                        {sub.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-bold leading-snug ${isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"}`}>
                          {sub.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground font-semibold">
                          <span className="uppercase tracking-wider">{sub.category}</span>
                          <span>·</span>
                          <span>{sub.duration}</span>
                          <span>·</span>
                          <span className="uppercase">{sub.level}</span>
                        </div>
                      </div>
                    </div>

                    {isActive && <div className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER CANVA VIEWPORT */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#07080b] p-6 relative">
          <div className="flex-1 rounded-2xl overflow-hidden bg-card border border-border shadow-2xl relative">
            {activeSubtheme ? (
              presentationMode === "pdf" && getLocalPdfForSubtheme(activeSubtheme) ? (
                <iframe
                  src={`${getLocalPdfForSubtheme(activeSubtheme)}#toolbar=0`}
                  className="w-full h-full border-0 absolute inset-0"
                />
              ) : activeSubtheme.canva_embed ? (
                <iframe
                  src={cleanCanvaUrl(activeSubtheme.canva_embed)}
                  className="w-full h-full border-0 absolute inset-0"
                  allowFullScreen
                  allow="fullscreen"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-muted-foreground border border-border shadow-inner">
                    <MonitorPlay className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-bold text-foreground">Apresentação não Vinculada</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Este subtema (**{activeSubtheme.title}**) não possui um link de apresentação do Canva cadastrado no catálogo.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-muted-foreground border border-border shadow-inner">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">Carregando Material</h3>
                  <p className="text-xs text-muted-foreground">Aguarde enquanto os subtemas são sincronizados.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom navigation bar */}
          <div className="h-16 flex items-center justify-between mt-4 flex-shrink-0 z-10 px-4 bg-card/60 backdrop-blur border border-border rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToSubtheme(Math.max(activeIndex - 1, 0))}
                disabled={activeIndex === 0}
                className="h-10 px-4 rounded-lg bg-surface border border-border text-xs font-semibold hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              {activeIndex === subthemes.length - 1 ? (
                <button
                  onClick={finishClass}
                  className="h-10 px-4 rounded-lg bg-destructive text-white text-xs font-bold shadow-md shadow-destructive/20 hover:shadow-lg hover:bg-destructive/90 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Finalizar Aula
                </button>
              ) : (
                <button
                  onClick={() => goToSubtheme(Math.min(activeIndex + 1, subthemes.length - 1))}
                  disabled={activeIndex === subthemes.length - 1}
                  className="h-10 px-4 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/10 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  Avançar
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pain-header">
              {getLocalPdfForSubtheme(activeSubtheme) && (
                <button
                  onClick={() => setPresentationMode(p => p === "canva" ? "pdf" : "canva")}
                  className={`h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    presentationMode === "pdf" 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-surface border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${presentationMode === "pdf" ? "text-primary" : "text-emerald-400"}`} />
                  {presentationMode === "canva" ? "Usar PDF Offline" : "Voltar p/ Canva"}
                </button>
              )}

              <button
                onClick={() => setLibraryOpen(true)}
                className="h-10 px-4 rounded-lg bg-surface border border-border text-xs font-semibold hover:text-foreground hover:bg-muted flex items-center gap-2"
              >
                <Library className="w-4 h-4 text-primary" />
                Biblioteca Rápida
              </button>
              
              <button
                onClick={() => setQrModalOpen(true)}
                className="h-10 px-4 rounded-lg bg-surface border border-border text-xs font-semibold hover:text-foreground hover:bg-muted flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-accent" />
                Presença
              </button>

              <button
                onClick={() => setAvaliacaoModalOpen(true)}
                className="h-10 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 flex items-center gap-2"
              >
                <ClipboardSignature className="w-4 h-4" />
                Avaliação Final
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── RAPID LIBRARY MODAL ── */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                Biblioteca Rápida de Matérias
              </h3>
              <button
                onClick={() => setLibraryOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
              {subthemes.map((sub, idx) => (
                <div
                  key={sub.id}
                  onClick={() => goToSubtheme(idx)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                    idx === activeIndex
                      ? "bg-primary/10 border-primary"
                      : "bg-surface/50 border-border hover:bg-surface"
                  }`}
                >
                  <h4 className="text-xs font-bold text-foreground">{sub.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground uppercase font-semibold">
                    <span>{sub.category}</span>
                    <span>·</span>
                    <span>{sub.duration}</span>
                    <span>·</span>
                    <span>{sub.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE PRESENÇA MODAL ── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-scale-in">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6 pt-4">
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">Registro de Presença</h3>
                <p className="text-xs text-muted-foreground">
                  Peça para os alunos escanearem o QR Code abaixo com a câmera do celular para registrar presença oficial na aula.
                </p>
              </div>

              {/* QR Code Placeholder container */}
              <div className="w-56 h-56 bg-white p-3 rounded-2xl mx-auto shadow-inner flex items-center justify-center relative border border-border">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCheckInUrl())}`} alt="QR Code Presença" className="w-full h-full object-contain" />
              </div>

              <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
                <button
                  onClick={handleCopyLink}
                  className="h-10 rounded-xl bg-surface border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  {copyFeedback ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copyFeedback ? "Link Copiado!" : "Copiar Link de Check-in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE AVALIAÇÃO MODAL ── */}
      {avaliacaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardSignature className="w-5 h-5 text-primary" />
                Prova de Aprendizagem
              </h3>
              <button
                onClick={() => setAvaliacaoModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Peça para os alunos escanearem o QR Code para acessar a <strong>Avaliação Final Teórica</strong> da turma.
                </p>
              </div>

              {/* QR Code Placeholder container */}
              <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(avaliacaoUrl)}`} alt="QR Code Avaliação" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <a href={avaliacaoUrl} target="_blank" rel="noreferrer" className="text-white text-xs font-bold underline bg-primary/80 px-3 py-1.5 rounded-full">Testar Link</a>
                </div>
              </div>

              <div className="w-full px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-[10px] font-mono text-primary/80 break-all">{avaliacaoUrl || "Carregando..."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedApresentacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] text-[#f3f3f3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-8 h-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xs text-muted-foreground animate-pulse tracking-widest uppercase font-semibold">Carregando cockpit unificado...</p>
        </div>
      </div>
    }>
      <UnifiedApresentacaoPageContent />
    </Suspense>
  );
}
