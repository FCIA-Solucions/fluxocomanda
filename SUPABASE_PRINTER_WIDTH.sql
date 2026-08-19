-- Adicionar coluna printer_width na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS printer_width TEXT DEFAULT '80mm' CHECK (printer_width IN ('58mm', '80mm'));

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
