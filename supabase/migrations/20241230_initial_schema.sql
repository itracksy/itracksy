-- Create auth schema and enable RLS
create schema if not exists auth;
alter schema auth owner to supabase_admin;

-- Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- Create custom types
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid');

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    phone TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT,
    client_id UUID REFERENCES public.clients(id),
    hourly_rate DECIMAL,
    currency TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    "order" INTEGER NOT NULL,
    column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) NOT NULL,
    board_id UUID REFERENCES public.boards(id) NOT NULL,
    number TEXT NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL NOT NULL,
    tax DECIMAL,
    total DECIMAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) NOT NULL,
    board_id UUID REFERENCES public.boards(id) NOT NULL,
    duration INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    description TEXT,
    invoice_id UUID REFERENCES public.invoices(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.window_tracking (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    owner_path TEXT NOT NULL,
    owner_process_id INTEGER NOT NULL,
    owner_bundle_id TEXT,
    owner_name TEXT NOT NULL,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    count INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_columns_board_id ON public.columns(board_id);
CREATE INDEX idx_items_column_id ON public.items(column_id);
CREATE INDEX idx_items_board_id ON public.items(board_id);
CREATE INDEX idx_time_entries_item_id ON public.time_entries(item_id);
CREATE INDEX idx_time_entries_board_id ON public.time_entries(board_id);
CREATE INDEX idx_time_entries_invoice_id ON public.time_entries(invoice_id);
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_window_tracking_user_id ON public.window_tracking(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.window_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own boards"
    ON public.boards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boards"
    ON public.boards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
    ON public.boards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
    ON public.boards FOR DELETE
    USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view columns in their boards"
    ON public.columns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = columns.board_id
        AND boards.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage items in their boards"
    ON public.items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = items.board_id
        AND boards.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their time entries"
    ON public.time_entries FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their window tracking"
    ON public.window_tracking FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their window tracking"
    ON public.window_tracking FOR INSERT
    WITH CHECK (user_id = auth.uid());
