-- =============================================================
-- Novo título e subtítulo do topo da página.
-- Só substitui os textos que ainda estão iguais ao padrão antigo,
-- para não apagar uma edição feita pelo painel.
-- =============================================================

update public.site_settings
set data = jsonb_set(data, '{hero,title}', to_jsonb('Marketing e tecnologia potencializando o crescimento.'::text))
where id = 1
  and data #>> '{hero,title}' = 'Marketing e tecnologia para o seu negócio crescer.';

update public.site_settings
set data = jsonb_set(
  data,
  '{hero,subtitle}',
  to_jsonb('Unimos análise de dados, estratégia de marketing, posicionamento de marca, desenvolvimento de sites e sistemas automatizados para transformar negócios, otimizar processos e aumentar a produtividade.'::text)
)
where id = 1
  and data #>> '{hero,subtitle}' = 'Estratégia digital, sites e sistemas web desenvolvidos para ajudar pequenos negócios a evoluir com mais presença, organização e profissionalismo.';
