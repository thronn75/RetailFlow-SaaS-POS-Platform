SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE public.inventory_movements (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    note character varying(500),
    quantity_change integer NOT NULL,
    stock_after integer NOT NULL,
    type character varying(40) NOT NULL,
    created_by_user_id uuid,
    product_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT inventory_movements_type_check CHECK (((type)::text = ANY ((ARRAY['INITIAL_STOCK'::character varying, 'STOCK_IN'::character varying, 'STOCK_OUT'::character varying, 'SALE'::character varying, 'ADJUSTMENT'::character varying])::text[])))
);

CREATE TABLE public.products (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    description character varying(500),
    name character varying(160) NOT NULL,
    price numeric(12,2) NOT NULL,
    sku character varying(80) NOT NULL,
    status character varying(30) NOT NULL,
    stock_quantity integer NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DELETED'::character varying])::text[])))
);

CREATE TABLE public.sale_items (
    id uuid NOT NULL,
    line_total numeric(12,2) NOT NULL,
    product_name_snapshot character varying(160) NOT NULL,
    quantity integer NOT NULL,
    sku_snapshot character varying(80) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    product_id uuid NOT NULL,
    sale_id uuid NOT NULL
);

CREATE TABLE public.sales (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    payment_method character varying(30) NOT NULL,
    sale_number character varying(80) NOT NULL,
    status character varying(30) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    created_by_user_id uuid,
    tenant_id uuid NOT NULL,
    CONSTRAINT sales_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'CARD'::character varying, 'ONLINE'::character varying])::text[]))),
    CONSTRAINT sales_status_check CHECK (((status)::text = ANY ((ARRAY['COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    name character varying(120) NOT NULL,
    slug character varying(80) NOT NULL,
    status character varying(30) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SUSPENDED'::character varying, 'DELETED'::character varying])::text[])))
);

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(160) NOT NULL,
    enabled boolean NOT NULL,
    full_name character varying(120) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['OWNER'::character varying, 'ADMIN'::character varying, 'MANAGER'::character varying, 'CASHIER'::character varying])::text[])))
);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT uk4moql6miwoh3w0drxa2gmjbll UNIQUE (name);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uk_products_tenant_sku UNIQUE (tenant_id, sku);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_email UNIQUE (email);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT ukkn82rs0p55luybrg4n7x7di8 UNIQUE (slug);

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT ukn0mb9m597xrmi5jbiogh74174 UNIQUE (sale_number);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk21hn1a5ja1tve7ae02fnn4cld FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk7lws1ve8g6b9itc054wj06uit FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk7tcpbc5c5mpnm8fl2phl8ep7l FOREIGN KEY (sale_id) REFERENCES public.sales(id);

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT fk8g0sjiqs7tg055o06p6wawu39 FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fke2r8coe7f79qhef1lx56205gh FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fkia3ny790cch5k0ihnyl8b8fo5 FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fkko8gwxe8r7rp8rcga9lj1x59o FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fkn8rwil6da3e23e0g04r5cw0mf FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fkou13r0y3kcbefjitv6viog57s FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);
