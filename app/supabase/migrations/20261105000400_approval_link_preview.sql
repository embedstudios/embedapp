-- Approvals carry one link (figma_url keeps its name for compatibility but can
-- be any URL). The admin portal fetches the page's preview metadata when the
-- approval is saved and stores it here, so the client sees a link card.
alter table public.approvals
  add column if not exists link_title text,
  add column if not exists link_description text,
  add column if not exists link_site text,
  add column if not exists link_image text;
