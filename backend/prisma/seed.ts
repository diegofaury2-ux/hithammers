import { PrismaClient, ProjectType, ProjectPriority, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function relDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('🌱 Semeando banco de dados...');

  // ── Usuários ──────────────────────────────────────────────────────────────
  const diegoHash = await bcrypt.hash('admin1234@', 10);
  const anaHash   = await bcrypt.hash('usuário1@', 10);
  const memberHash = await bcrypt.hash('membro123@', 10);

  const diego = await prisma.user.upsert({
    where: { id: 'seed-user-diego' },
    update: { name: 'Diego Faury', email: 'diego@hithammers.com', roleTitle: 'Estagiário' },
    create: { id: 'seed-user-diego', name: 'Diego Faury', email: 'diego@hithammers.com', passwordHash: diegoHash, profile: 'admin', roleTitle: 'Estagiário', mustChangePassword: false },
  });

  const ana = await prisma.user.upsert({
    where: { id: 'seed-user-ana' },
    update: { name: 'Ana Lívia', email: 'ana@hithammers.com', roleTitle: 'Analista' },
    create: { id: 'seed-user-ana', name: 'Ana Lívia', email: 'ana@hithammers.com', passwordHash: anaHash, profile: 'member', roleTitle: 'Analista', mustChangePassword: false },
  });

  const luiz = await prisma.user.upsert({
    where: { id: 'seed-user-luiz' },
    update: { name: 'Luiz Perez', email: 'luiz.perez@afazedoria.com', roleTitle: 'CEO' },
    create: { id: 'seed-user-luiz', name: 'Luiz Perez', email: 'luiz.perez@afazedoria.com', passwordHash: memberHash, profile: 'member', roleTitle: 'CEO', mustChangePassword: false },
  });

  const val = await prisma.user.upsert({
    where: { id: 'seed-user-val' },
    update: { name: 'Val Soares', email: 'val.soares@afazedoria.com', roleTitle: 'CEO' },
    create: { id: 'seed-user-val', name: 'Val Soares', email: 'val.soares@afazedoria.com', passwordHash: memberHash, profile: 'member', roleTitle: 'CEO', mustChangePassword: false },
  });

  const eduardo = await prisma.user.upsert({
    where: { id: 'seed-user-eduardo' },
    update: { name: 'Eduardo', email: 'eduardo@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-eduardo', name: 'Eduardo', email: 'eduardo@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const thiago = await prisma.user.upsert({
    where: { id: 'seed-user-thiago' },
    update: { name: 'Thiago', email: 'thiago@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-thiago', name: 'Thiago', email: 'thiago@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const renato = await prisma.user.upsert({
    where: { id: 'seed-user-renato' },
    update: { name: 'Renato', email: 'renato@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-renato', name: 'Renato', email: 'renato@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const larissa = await prisma.user.upsert({
    where: { id: 'seed-user-larissa' },
    update: { name: 'Larissa', email: 'larissa@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-larissa', name: 'Larissa', email: 'larissa@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const iza = await prisma.user.upsert({
    where: { id: 'seed-user-iza' },
    update: { name: 'Iza', email: 'iza@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-iza', name: 'Iza', email: 'iza@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const mapurunga = await prisma.user.upsert({
    where: { id: 'seed-user-mapurunga' },
    update: { name: 'Mapurunga', email: 'mapurunga@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-mapurunga', name: 'Mapurunga', email: 'mapurunga@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const alana = await prisma.user.upsert({
    where: { id: 'seed-user-alana' },
    update: { name: 'Alana', email: 'alana@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-alana', name: 'Alana', email: 'alana@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  const joao = await prisma.user.upsert({
    where: { id: 'seed-user-joao' },
    update: { name: 'João', email: 'joao@hithammers.com', roleTitle: '' },
    create: { id: 'seed-user-joao', name: 'João', email: 'joao@hithammers.com', passwordHash: memberHash, profile: 'member', roleTitle: '', mustChangePassword: false },
  });

  console.log('✅ Usuários criados');

  // ── Times ─────────────────────────────────────────────────────────────────
  const afazedoria = await prisma.team.upsert({
    where: { id: 'seed-team-afazedoria' },
    update: { name: 'Afazedoria' },
    create: { id: 'seed-team-afazedoria', name: 'Afazedoria', description: 'Equipe Afazedoria', color: '#2C5A52' },
  });

  const hithammers = await prisma.team.upsert({
    where: { id: 'seed-team-hithammers' },
    update: { name: 'Hithammers' },
    create: { id: 'seed-team-hithammers', name: 'Hithammers', description: 'Equipe Hithammers', color: '#CCFF00' },
  });

  const paraello = await prisma.team.upsert({
    where: { id: 'seed-team-paraello' },
    update: {},
    create: { id: 'seed-team-paraello', name: 'Paraèllo', description: 'Equipe Paraèllo', color: '#FF9900' },
  });

  const ceubTeam = await prisma.team.upsert({
    where: { id: 'seed-team-ceub' },
    update: {},
    create: { id: 'seed-team-ceub', name: 'CEUB', description: 'Equipe CEUB', color: '#3b82f6' },
  });

  // Reset e recriar memberships para garantir estado correto
  await prisma.teamMember.deleteMany({ where: { teamId: { in: [afazedoria.id, hithammers.id, ceubTeam.id, paraello.id] } } });

  const allMembers = [diego, ana, luiz, val, eduardo, thiago, renato, larissa, iza, mapurunga, alana, joao];

  const memberships = [
    // Afazedoria: Ana, Diego, Val, Luiz, Eduardo, Thiago
    { teamId: afazedoria.id, userId: ana.id },
    { teamId: afazedoria.id, userId: diego.id },
    { teamId: afazedoria.id, userId: val.id },
    { teamId: afazedoria.id, userId: luiz.id },
    { teamId: afazedoria.id, userId: eduardo.id },
    { teamId: afazedoria.id, userId: thiago.id },
    // Hithammers: todos
    ...allMembers.map(u => ({ teamId: hithammers.id, userId: u.id })),
    // CEUB: todos
    ...allMembers.map(u => ({ teamId: ceubTeam.id, userId: u.id })),
    // Paraèllo: Ana, Diego, Val, Luiz, Eduardo, Thiago
    { teamId: paraello.id, userId: ana.id },
    { teamId: paraello.id, userId: diego.id },
    { teamId: paraello.id, userId: val.id },
    { teamId: paraello.id, userId: luiz.id },
    { teamId: paraello.id, userId: eduardo.id },
    { teamId: paraello.id, userId: thiago.id },
  ];
  for (const m of memberships) {
    await prisma.teamMember.upsert({ where: { teamId_userId: m }, update: {}, create: m });
  }

  console.log('✅ Times criados');

  // ── Clientes ──────────────────────────────────────────────────────────────
  const ceub = await prisma.client.upsert({ where: { id: 'seed-client-ceub' }, update: {}, create: { id: 'seed-client-ceub', name: 'CEUB' } });
  const grupoReal = await prisma.client.upsert({ where: { id: 'seed-client-gruporeal' }, update: {}, create: { id: 'seed-client-gruporeal', name: 'Grupo Real' } });
  const boticario = await prisma.client.upsert({ where: { id: 'seed-client-boticario' }, update: {}, create: { id: 'seed-client-boticario', name: 'Grupo Boticário' } });

  console.log('✅ Clientes criados');

  // ── Projetos e Tarefas ────────────────────────────────────────────────────
  type ProjectSeed = {
    id: string; name: string; description: string; whatWhy: string; howWhere: string;
    budget: number; clientId: string; projectType: ProjectType; priority: ProjectPriority;
    status: ProjectStatus; startDays: number; endDays: number; teamId: string;
    tasks: TaskSeed[];
  };

  type TaskSeed = {
    id: string; title: string; description: string; priority: TaskPriority;
    status: TaskStatus; dueDays: number; assigneeIds: string[];
  };

  const projects: ProjectSeed[] = [
    // ── Afazedoria ──
    {
      id: 'seed-proj-branding-ceub', name: 'Branding CEUB', teamId: afazedoria.id,
      description: 'Reformulação da identidade visual do CEUB', whatWhy: 'Modernizar a marca do CEUB para atrair novos alunos e reposicionar no mercado educacional',
      howWhere: 'Pesquisa de marca, criação de manual de identidade visual, aplicações digitais e impressas',
      budget: 45000, clientId: ceub.id, projectType: 'branding', priority: 'high', status: 'active', startDays: -30, endDays: 60,
      tasks: [
        { id: 'seed-task-bc-1', title: 'Briefing e pesquisa de marca', description: 'Levantar histórico, valores e posicionamento', priority: 'high', status: 'done', dueDays: -20, assigneeIds: [ana.id] },
        { id: 'seed-task-bc-2', title: 'Moodboard e referências visuais', description: 'Apresentar 3 direções criativas', priority: 'medium', status: 'done', dueDays: -10, assigneeIds: [larissa.id] },
        { id: 'seed-task-bc-3', title: 'Desenvolvimento do logo', description: 'Criar propostas de logotipo com variações', priority: 'critical', status: 'in_progress', dueDays: 5, assigneeIds: [larissa.id, ana.id] },
        { id: 'seed-task-bc-4', title: 'Paleta de cores e tipografia', description: 'Definir sistema de cores e fontes institucionais', priority: 'high', status: 'in_progress', dueDays: 10, assigneeIds: [iza.id] },
        { id: 'seed-task-bc-5', title: 'Manual de identidade visual', description: 'Documentar todas as diretrizes de uso da marca', priority: 'high', status: 'todo', dueDays: 30, assigneeIds: [ana.id] },
        { id: 'seed-task-bc-6', title: 'Aplicações digitais (redes sociais)', description: 'Templates para Instagram, LinkedIn e email', priority: 'medium', status: 'todo', dueDays: 45, assigneeIds: [larissa.id, iza.id] },
        { id: 'seed-task-bc-7', title: 'Revisão final e entrega', description: 'Apresentação ao cliente e ajustes finais', priority: 'high', status: 'todo', dueDays: 58, assigneeIds: [ana.id] },
        { id: 'seed-task-bc-8', title: 'Relatório de acompanhamento semana 1', description: 'Status semanal enviado ao cliente', priority: 'low', status: 'overdue', dueDays: -5, assigneeIds: [ana.id] },
      ],
    },
    {
      id: 'seed-proj-campanha-boticario', name: 'Campanha Digital Boticário', teamId: afazedoria.id,
      description: 'Campanha de marketing digital Q2 para Grupo Boticário',
      whatWhy: 'Aumentar vendas online em 30% no Q2 através de estratégia digital integrada',
      howWhere: 'Mídia paga, social media, email marketing e influenciadores',
      budget: 120000, clientId: boticario.id, projectType: 'campanha_digital', priority: 'critical', status: 'active', startDays: -15, endDays: 30,
      tasks: [
        { id: 'seed-task-cb-1', title: 'Estratégia de campanha', description: 'Definir KPIs, personas e canais', priority: 'critical', status: 'done', dueDays: -12, assigneeIds: [ana.id, iza.id] },
        { id: 'seed-task-cb-2', title: 'Criação de copies e artes', description: 'Peças para todas as etapas do funil', priority: 'critical', status: 'done', dueDays: -5, assigneeIds: [larissa.id] },
        { id: 'seed-task-cb-3', title: 'Configuração de campanhas pagas', description: 'Google Ads, Meta Ads e TikTok Ads', priority: 'critical', status: 'in_progress', dueDays: 3, assigneeIds: [iza.id] },
        { id: 'seed-task-cb-4', title: 'Relatório de performance semana 1', description: 'Análise de resultados e otimizações', priority: 'high', status: 'overdue', dueDays: -2, assigneeIds: [ana.id] },
        { id: 'seed-task-cb-5', title: 'Ajuste de segmentação', description: 'Otimizar públicos com base nos dados iniciais', priority: 'high', status: 'in_progress', dueDays: 7, assigneeIds: [iza.id] },
        { id: 'seed-task-cb-6', title: 'Relatório final de campanha', description: 'Consolidar todos os KPIs e aprendizados', priority: 'high', status: 'todo', dueDays: 29, assigneeIds: [ana.id, larissa.id] },
        { id: 'seed-task-cb-7', title: 'Apresentação ao cliente', description: 'Reunião de encerramento com resultados', priority: 'medium', status: 'todo', dueDays: 30, assigneeIds: [ana.id] },
      ],
    },
    {
      id: 'seed-proj-growth-real', name: 'Growth Grupo Real', teamId: afazedoria.id,
      description: 'Estratégia de crescimento orgânico para Grupo Real',
      whatWhy: 'Aumentar presença digital e geração de leads qualificados',
      howWhere: 'SEO, conteúdo, automação de marketing e parcerias estratégicas',
      budget: 30000, clientId: grupoReal.id, projectType: 'growth', priority: 'medium', status: 'paused', startDays: -45, endDays: 90,
      tasks: [
        { id: 'seed-task-gr-1', title: 'Auditoria de SEO', description: 'Análise técnica e de conteúdo do site', priority: 'high', status: 'done', dueDays: -40, assigneeIds: [iza.id] },
        { id: 'seed-task-gr-2', title: 'Plano de conteúdo Q2', description: 'Calendário editorial para blog e redes', priority: 'medium', status: 'done', dueDays: -30, assigneeIds: [larissa.id] },
        { id: 'seed-task-gr-3', title: 'Implementação de melhorias técnicas SEO', description: 'Correções de velocidade, schema e meta tags', priority: 'high', status: 'overdue', dueDays: -10, assigneeIds: [iza.id] },
        { id: 'seed-task-gr-4', title: 'Produção de conteúdo Maio', description: '8 artigos para blog + 20 posts redes sociais', priority: 'medium', status: 'todo', dueDays: 20, assigneeIds: [larissa.id] },
        { id: 'seed-task-gr-5', title: 'Configuração de automação de email', description: 'Fluxo de nutrição para novos leads', priority: 'medium', status: 'todo', dueDays: 35, assigneeIds: [ana.id, iza.id] },
      ],
    },
    // ── Hithammers ──
    {
      id: 'seed-proj-branding-hit', name: 'Branding Hithammers 2026', teamId: hithammers.id,
      description: 'Atualização da identidade visual da própria Hithammers',
      whatWhy: 'Modernizar posicionamento da agência para atrair clientes maiores em 2026',
      howWhere: 'Redesign completo: logo, site, materiais comerciais e apresentações',
      budget: 15000, clientId: grupoReal.id, projectType: 'branding', priority: 'high', status: 'active', startDays: -20, endDays: 50,
      tasks: [
        { id: 'seed-task-bh-1', title: 'Workshop de posicionamento', description: 'Definir proposta de valor e diferenciais', priority: 'critical', status: 'done', dueDays: -15, assigneeIds: [diego.id, luiz.id] },
        { id: 'seed-task-bh-2', title: 'Redesign do logotipo', description: 'Novas propostas mantendo DNA da marca', priority: 'critical', status: 'in_progress', dueDays: 7, assigneeIds: [luiz.id] },
        { id: 'seed-task-bh-3', title: 'Novo site institucional', description: 'Redesign completo do site em Webflow', priority: 'high', status: 'todo', dueDays: 30, assigneeIds: [eduardo.id, luiz.id] },
        { id: 'seed-task-bh-4', title: 'Template de proposta comercial', description: 'Novo layout para apresentações de projetos', priority: 'medium', status: 'todo', dueDays: 40, assigneeIds: [val.id] },
        { id: 'seed-task-bh-5', title: 'Atualização redes sociais', description: 'Novos destaques, bio e grid do Instagram', priority: 'low', status: 'todo', dueDays: 48, assigneeIds: [val.id] },
        { id: 'seed-task-bh-6', title: 'Briefing de marca', description: 'Documento de posicionamento inicial', priority: 'high', status: 'overdue', dueDays: -3, assigneeIds: [diego.id] },
      ],
    },
    {
      id: 'seed-proj-evento-lancamento', name: 'Evento Lançamento', teamId: hithammers.id,
      description: 'Evento de lançamento de produto para CEUB',
      whatWhy: 'Apresentar novo produto educacional para formadores de opinião e imprensa',
      howWhere: 'Evento presencial em Brasília para 200 convidados + cobertura digital',
      budget: 80000, clientId: ceub.id, projectType: 'eventos', priority: 'critical', status: 'active', startDays: -10, endDays: 20,
      tasks: [
        { id: 'seed-task-el-1', title: 'Definição de local e data', description: 'Pesquisa e contratação do espaço', priority: 'critical', status: 'done', dueDays: -8, assigneeIds: [diego.id] },
        { id: 'seed-task-el-2', title: 'Lista de convidados VIP', description: 'Mapeamento e confirmações de presença', priority: 'critical', status: 'done', dueDays: -5, assigneeIds: [val.id] },
        { id: 'seed-task-el-3', title: 'Produção de materiais gráficos', description: 'Backdrop, banners, convites e crachás', priority: 'critical', status: 'in_progress', dueDays: 2, assigneeIds: [luiz.id] },
        { id: 'seed-task-el-4', title: 'Contratação de fornecedores', description: 'Buffet, audiovisual e fotografia', priority: 'critical', status: 'overdue', dueDays: -1, assigneeIds: [diego.id, val.id] },
        { id: 'seed-task-el-5', title: 'Roteiro do evento', description: 'Programação detalhada hora a hora', priority: 'high', status: 'in_progress', dueDays: 5, assigneeIds: [val.id] },
        { id: 'seed-task-el-6', title: 'Cobertura em redes sociais', description: 'Stories, reels e posts em tempo real', priority: 'high', status: 'todo', dueDays: 19, assigneeIds: [val.id, luiz.id] },
        { id: 'seed-task-el-7', title: 'Relatório pós-evento', description: 'Consolidar métricas de alcance e engajamento', priority: 'medium', status: 'todo', dueDays: 20, assigneeIds: [diego.id] },
      ],
    },
    {
      id: 'seed-proj-campanha-q2', name: 'Campanha Q2 2026', teamId: hithammers.id,
      description: 'Campanha de mídia paga Q2 para Grupo Boticário',
      whatWhy: 'Atingir metas de vendas do segundo trimestre',
      howWhere: 'Google Ads, Meta Ads e influenciadores',
      budget: 60000, clientId: boticario.id, projectType: 'campanha_digital', priority: 'medium', status: 'completed', startDays: -60, endDays: -5,
      tasks: [
        { id: 'seed-task-cq-1', title: 'Planejamento de campanha', description: '', priority: 'high', status: 'done', dueDays: -55, assigneeIds: [val.id] },
        { id: 'seed-task-cq-2', title: 'Criação das peças', description: '', priority: 'high', status: 'done', dueDays: -45, assigneeIds: [luiz.id, val.id] },
        { id: 'seed-task-cq-3', title: 'Configuração das campanhas', description: '', priority: 'critical', status: 'done', dueDays: -40, assigneeIds: [eduardo.id] },
        { id: 'seed-task-cq-4', title: 'Otimizações semana 1', description: '', priority: 'high', status: 'done', dueDays: -30, assigneeIds: [eduardo.id] },
        { id: 'seed-task-cq-5', title: 'Otimizações semana 2', description: '', priority: 'medium', status: 'done', dueDays: -20, assigneeIds: [eduardo.id] },
        { id: 'seed-task-cq-6', title: 'Relatório final', description: '', priority: 'high', status: 'done', dueDays: -6, assigneeIds: [val.id] },
      ],
    },
    // ── Paraèllo ──
    {
      id: 'seed-proj-growth-boticario', name: 'Growth Boticário', teamId: paraello.id,
      description: 'Estratégia de growth hacking para Grupo Boticário',
      whatWhy: 'Escalar aquisição de novos clientes de forma sustentável',
      howWhere: 'Funil de aquisição otimizado, testes A/B, CRO e automações',
      budget: 55000, clientId: boticario.id, projectType: 'growth', priority: 'high', status: 'active', startDays: -25, endDays: 65,
      tasks: [
        { id: 'seed-task-gb-1', title: 'Diagnóstico do funil atual', description: 'Mapeamento de toda a jornada do cliente', priority: 'high', status: 'done', dueDays: -20, assigneeIds: [thiago.id] },
        { id: 'seed-task-gb-2', title: 'Hipóteses de crescimento', description: 'Backlog de experimentos priorizados por ICE', priority: 'high', status: 'done', dueDays: -12, assigneeIds: [thiago.id, renato.id] },
        { id: 'seed-task-gb-3', title: 'Experimento: onboarding email', description: 'Teste de nova sequência de boas-vindas', priority: 'critical', status: 'in_progress', dueDays: 8, assigneeIds: [renato.id] },
        { id: 'seed-task-gb-4', title: 'Experimento: landing page CRO', description: 'Teste A/B na página de produto principal', priority: 'high', status: 'in_progress', dueDays: 15, assigneeIds: [thiago.id] },
        { id: 'seed-task-gb-5', title: 'Relatório de experimentos', description: 'Documentar aprendizados e próximos passos', priority: 'medium', status: 'todo', dueDays: 30, assigneeIds: [renato.id] },
        { id: 'seed-task-gb-6', title: 'Implementação de melhorias validadas', description: 'Escalar o que funcionou nos experimentos', priority: 'high', status: 'todo', dueDays: 55, assigneeIds: [thiago.id, renato.id] },
        { id: 'seed-task-gb-7', title: 'Configurar analytics avançado', description: 'GA4, Hotjar e Mixpanel', priority: 'critical', status: 'overdue', dueDays: -3, assigneeIds: [thiago.id] },
      ],
    },
    {
      id: 'seed-proj-id-ceub', name: 'Identidade Visual CEUB', teamId: paraello.id,
      description: 'Criação de identidade visual para novo produto educacional do CEUB',
      whatWhy: 'Lançar novo curso com identidade forte e diferenciada',
      howWhere: 'Design estratégico de marca, aplicações digitais e materiais de lançamento',
      budget: 25000, clientId: ceub.id, projectType: 'branding', priority: 'medium', status: 'active', startDays: -35, endDays: 45,
      tasks: [
        { id: 'seed-task-ic-1', title: 'Pesquisa de mercado e concorrentes', description: '', priority: 'medium', status: 'done', dueDays: -30, assigneeIds: [renato.id] },
        { id: 'seed-task-ic-2', title: 'Criação de logo e marca', description: '', priority: 'high', status: 'done', dueDays: -15, assigneeIds: [thiago.id] },
        { id: 'seed-task-ic-3', title: 'Sistema de cores e tipografia', description: '', priority: 'medium', status: 'in_progress', dueDays: 5, assigneeIds: [thiago.id] },
        { id: 'seed-task-ic-4', title: 'Material de lançamento', description: 'Banner, post e story para anuncio', priority: 'high', status: 'todo', dueDays: 20, assigneeIds: [renato.id] },
        { id: 'seed-task-ic-5', title: 'Manual de marca resumido', description: '', priority: 'medium', status: 'todo', dueDays: 40, assigneeIds: [thiago.id] },
        { id: 'seed-task-ic-6', title: 'Revisão de briefing com cliente', description: '', priority: 'high', status: 'overdue', dueDays: -8, assigneeIds: [renato.id] },
      ],
    },
    {
      id: 'seed-proj-eventos-corp', name: 'Eventos Corporativos Grupo Real', teamId: paraello.id,
      description: 'Organização de eventos corporativos anuais do Grupo Real',
      whatWhy: 'Fortalecer cultura organizacional e engajamento de colaboradores',
      howWhere: 'Eventos internos trimestrais + convenção anual',
      budget: 40000, clientId: grupoReal.id, projectType: 'eventos', priority: 'low', status: 'paused', startDays: -50, endDays: 120,
      tasks: [
        { id: 'seed-task-ec-1', title: 'Calendário anual de eventos', description: '', priority: 'medium', status: 'done', dueDays: -45, assigneeIds: [renato.id] },
        { id: 'seed-task-ec-2', title: 'Briefing evento Q2', description: '', priority: 'medium', status: 'done', dueDays: -30, assigneeIds: [thiago.id] },
        { id: 'seed-task-ec-3', title: 'Orçamento e fornecedores', description: '', priority: 'low', status: 'todo', dueDays: 30, assigneeIds: [renato.id] },
        { id: 'seed-task-ec-4', title: 'Produção de materiais', description: '', priority: 'low', status: 'todo', dueDays: 60, assigneeIds: [thiago.id] },
        { id: 'seed-task-ec-5', title: 'Execução evento Q3', description: '', priority: 'medium', status: 'todo', dueDays: 90, assigneeIds: [thiago.id, renato.id] },
      ],
    },
  ];

  for (const proj of projects) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tasks, teamId, startDays, endDays, ...projData } = proj;
    const project = await prisma.project.upsert({
      where: { id: proj.id },
      update: {},
      create: {
        ...projData,
        startDate: relDate(startDays),
        endDate: relDate(endDays),
        createdById: diego.id,
        projectTeams: { create: [{ teamId }] },
      },
    });

    for (const task of tasks) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { assigneeIds, dueDays, ...taskData } = task;
      const existing = await prisma.task.findUnique({ where: { id: task.id } });
      if (!existing) {
        const created = await prisma.task.create({
          data: {
            ...taskData,
            projectId: project.id,
            dueDate: relDate(dueDays),
            completedAt: task.status === 'done' ? relDate(task.dueDays) : undefined,
            timeSpentMinutes: task.status === 'done' ? Math.floor(Math.random() * 240) + 30 : undefined,
            createdById: diego.id,
            assignees: { create: assigneeIds.map(uid => ({ userId: uid })) },
          },
        });
        void created;
      }
    }

    // Recalc completionPct
    const total = await prisma.task.count({ where: { projectId: project.id, deletedAt: null } });
    const done = await prisma.task.count({ where: { projectId: project.id, deletedAt: null, status: 'done' } });
    await prisma.project.update({ where: { id: project.id }, data: { completionPct: total > 0 ? Math.round((done / total) * 100) : 0 } });
  }

  console.log('✅ Projetos e tarefas criados');

  // Adicionar dependências entre tarefas (cadeias longas para demonstrar a funcionalidade)
  const deps = [
    // Branding CEUB: cadeia logo → manual → aplicações → revisão
    { dependentTaskId: 'seed-task-bc-3', dependencyTaskId: 'seed-task-bc-2' },
    { dependentTaskId: 'seed-task-bc-5', dependencyTaskId: 'seed-task-bc-3' },
    { dependentTaskId: 'seed-task-bc-5', dependencyTaskId: 'seed-task-bc-4' },
    { dependentTaskId: 'seed-task-bc-6', dependencyTaskId: 'seed-task-bc-4' },
    { dependentTaskId: 'seed-task-bc-7', dependencyTaskId: 'seed-task-bc-5' },
    { dependentTaskId: 'seed-task-bc-7', dependencyTaskId: 'seed-task-bc-6' },
    // Campanha Boticário: configuração → ajuste → relatório
    { dependentTaskId: 'seed-task-cb-5', dependencyTaskId: 'seed-task-cb-3' },
    { dependentTaskId: 'seed-task-cb-6', dependencyTaskId: 'seed-task-cb-5' },
    { dependentTaskId: 'seed-task-cb-7', dependencyTaskId: 'seed-task-cb-6' },
    // Evento: local → materiais; convidados → roteiro
    { dependentTaskId: 'seed-task-el-3', dependencyTaskId: 'seed-task-el-1' },
    { dependentTaskId: 'seed-task-el-4', dependencyTaskId: 'seed-task-el-1' },
    { dependentTaskId: 'seed-task-el-5', dependencyTaskId: 'seed-task-el-2' },
    { dependentTaskId: 'seed-task-el-6', dependencyTaskId: 'seed-task-el-3' },
    { dependentTaskId: 'seed-task-el-7', dependencyTaskId: 'seed-task-el-5' },
    // Branding Hithammers: logo → site → template
    { dependentTaskId: 'seed-task-bh-3', dependencyTaskId: 'seed-task-bh-2' },
    { dependentTaskId: 'seed-task-bh-4', dependencyTaskId: 'seed-task-bh-2' },
    { dependentTaskId: 'seed-task-bh-5', dependencyTaskId: 'seed-task-bh-3' },
    // Growth Boticário: experimentos → melhorias
    { dependentTaskId: 'seed-task-gb-3', dependencyTaskId: 'seed-task-gb-1' },
    { dependentTaskId: 'seed-task-gb-4', dependencyTaskId: 'seed-task-gb-1' },
    { dependentTaskId: 'seed-task-gb-5', dependencyTaskId: 'seed-task-gb-3' },
    { dependentTaskId: 'seed-task-gb-5', dependencyTaskId: 'seed-task-gb-4' },
    { dependentTaskId: 'seed-task-gb-6', dependencyTaskId: 'seed-task-gb-5' },
    // Identidade CEUB: pesquisa → logo → sistema → material → manual
    { dependentTaskId: 'seed-task-ic-2', dependencyTaskId: 'seed-task-ic-1' },
    { dependentTaskId: 'seed-task-ic-3', dependencyTaskId: 'seed-task-ic-2' },
    { dependentTaskId: 'seed-task-ic-4', dependencyTaskId: 'seed-task-ic-3' },
    { dependentTaskId: 'seed-task-ic-5', dependencyTaskId: 'seed-task-ic-4' },
  ];
  for (const dep of deps) {
    const t1 = await prisma.task.findUnique({ where: { id: dep.dependentTaskId } });
    const t2 = await prisma.task.findUnique({ where: { id: dep.dependencyTaskId } });
    if (t1 && t2) {
      await prisma.taskDependency.upsert({
        where: { dependentTaskId_dependencyTaskId: dep },
        update: {},
        create: dep,
      });
    }
  }

  console.log('✅ Dependências criadas');

  // ── Checklists ─────────────────────────────────────────────────────────────
  type ChecklistSeed = { taskId: string; items: { text: string; isDone: boolean }[] };
  const checklists: ChecklistSeed[] = [
    { taskId: 'seed-task-bc-3', items: [
      { text: 'Pesquisar referências de logos educacionais', isDone: true },
      { text: 'Criar 3 sketches iniciais', isDone: true },
      { text: 'Apresentar rascunhos ao cliente', isDone: false },
      { text: 'Refinamento com base no feedback', isDone: false },
      { text: 'Versão final aprovada', isDone: false },
    ]},
    { taskId: 'seed-task-el-3', items: [
      { text: 'Definir especificações técnicas do backdrop', isDone: true },
      { text: 'Criar arquivos para impressão (CMYK 300dpi)', isDone: false },
      { text: 'Aprovar com cliente', isDone: false },
      { text: 'Enviar para gráfica', isDone: false },
    ]},
    { taskId: 'seed-task-bh-2', items: [
      { text: 'Análise do logo atual', isDone: true },
      { text: 'Pesquisa de tendências em branding de agências', isDone: true },
      { text: 'Criar variações da marca', isDone: false },
      { text: 'Teste em diferentes aplicações', isDone: false },
      { text: 'Aprovação interna', isDone: false },
    ]},
    { taskId: 'seed-task-gb-3', items: [
      { text: 'Mapear sequência atual de onboarding', isDone: true },
      { text: 'Criar nova sequência de 5 emails', isDone: true },
      { text: 'Configurar no ESP (Klaviyo)', isDone: false },
      { text: 'Rodar teste A/B por 2 semanas', isDone: false },
      { text: 'Analisar resultados e documentar', isDone: false },
    ]},
    { taskId: 'seed-task-cb-3', items: [
      { text: 'Criar conta Google Ads e Meta Business', isDone: true },
      { text: 'Configurar pixel de conversão no site', isDone: true },
      { text: 'Subir criativos aprovados', isDone: false },
      { text: 'Definir orçamento por canal', isDone: false },
      { text: 'Ativar campanhas e monitorar 24h', isDone: false },
    ]},
    { taskId: 'seed-task-el-4', items: [
      { text: 'Levantar lista de fornecedores de buffet', isDone: true },
      { text: 'Solicitar orçamentos (mín. 3)', isDone: true },
      { text: 'Contratar empresa de audiovisual', isDone: false },
      { text: 'Fechar fotógrafo/videomaker', isDone: false },
      { text: 'Assinar contratos e emitir NFs', isDone: false },
    ]},
    { taskId: 'seed-task-bh-3', items: [
      { text: 'Definir arquitetura de informação', isDone: false },
      { text: 'Criar wireframes das páginas principais', isDone: false },
      { text: 'Desenvolver design no Figma', isDone: false },
      { text: 'Implementar em Webflow', isDone: false },
      { text: 'Testes de responsividade', isDone: false },
      { text: 'Publicar domínio', isDone: false },
    ]},
    { taskId: 'seed-task-gb-4', items: [
      { text: 'Mapear página de produto atual', isDone: true },
      { text: 'Formular hipótese de melhoria', isDone: true },
      { text: 'Criar variante B no Unbounce', isDone: false },
      { text: 'Configurar teste A/B no Google Optimize', isDone: false },
      { text: 'Aguardar significância estatística (95%)', isDone: false },
      { text: 'Documentar resultado e implementar vencedor', isDone: false },
    ]},
    { taskId: 'seed-task-ic-3', items: [
      { text: 'Definir paleta primária (3 cores)', isDone: true },
      { text: 'Definir paleta secundária (2 cores)', isDone: false },
      { text: 'Selecionar família tipográfica principal', isDone: false },
      { text: 'Selecionar fonte para títulos', isDone: false },
      { text: 'Testar acessibilidade de contraste (WCAG AA)', isDone: false },
    ]},
    { taskId: 'seed-task-bc-4', items: [
      { text: 'Pesquisar paletas de concorrentes', isDone: true },
      { text: 'Criar 3 propostas de paleta', isDone: true },
      { text: 'Apresentar ao cliente e coletar feedback', isDone: false },
      { text: 'Refinar paleta aprovada', isDone: false },
      { text: 'Testar nas aplicações digitais', isDone: false },
    ]},
  ];

  for (const cl of checklists) {
    const task = await prisma.task.findUnique({ where: { id: cl.taskId } });
    if (!task) continue;
    const existing = await prisma.taskChecklistItem.count({ where: { taskId: cl.taskId } });
    if (existing > 0) continue;
    for (let i = 0; i < cl.items.length; i++) {
      await prisma.taskChecklistItem.create({
        data: { taskId: cl.taskId, text: cl.items[i].text, isDone: cl.items[i].isDone, order: i },
      });
    }
  }

  console.log('✅ Checklists criados');

  // ── Comentários ────────────────────────────────────────────────────────────
  type CommentSeed = { taskId: string; authorId: string; content: string; isAdminOnly: boolean };
  const comments: CommentSeed[] = [
    { taskId: 'seed-task-bc-3', authorId: diego.id, content: 'Lembrar de usar a paleta de cores aprovada na etapa anterior. O cliente é conservador com vermelho.', isAdminOnly: true },
    { taskId: 'seed-task-bc-3', authorId: larissa.id, content: 'Já finalizei os primeiros 3 sketches, vou apresentar amanhã na reunião.', isAdminOnly: false },
    { taskId: 'seed-task-el-4', authorId: diego.id, content: 'URGENTE: o buffet precisa confirmar até sexta-feira ou vamos perder o slot. Entrar em contato hoje.', isAdminOnly: true },
    { taskId: 'seed-task-el-4', authorId: val.id, content: 'Já entrei em contato com 3 empresas de buffet, aguardando retorno de 2 delas.', isAdminOnly: false },
    { taskId: 'seed-task-bh-2', authorId: diego.id, content: 'Revisar o resultado com o time antes de apresentar. Precisamos de consenso interno antes de ir ao cliente.', isAdminOnly: true },
    { taskId: 'seed-task-cb-4', authorId: diego.id, content: 'O relatório está atrasado. Ana, por favor priorize isso — o cliente vai cobrar na reunião de quinta.', isAdminOnly: false },
    { taskId: 'seed-task-gb-7', authorId: diego.id, content: 'Essa tarefa está travando o funil inteiro. Preciso de um update até amanhã.', isAdminOnly: true },
    { taskId: 'seed-task-gb-3', authorId: renato.id, content: 'Terminei de criar os 5 emails. Estou configurando no Klaviyo agora.', isAdminOnly: false },
  ];

  for (const c of comments) {
    const task = await prisma.task.findUnique({ where: { id: c.taskId } });
    if (!task) continue;
    const existing = await prisma.taskComment.count({ where: { taskId: c.taskId, authorId: c.authorId, content: c.content } });
    if (existing > 0) continue;
    await prisma.taskComment.create({
      data: { taskId: c.taskId, authorId: c.authorId, content: c.content, isAdminOnly: c.isAdminOnly },
    });
  }

  console.log('✅ Comentários criados');

  console.log('\n─────────────────────────────────────────────────');
  console.log('📋 CREDENCIAIS DE ACESSO:');
  console.log('  Administrador: diego@hithammers.com  |  admin1234@');
  console.log('  Membro:        ana.jovino@afazedoria.com  |  usuário1@');
  console.log('  Outros membros: email@dominio.com  |  membro123@');
  console.log('─────────────────────────────────────────────────\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
