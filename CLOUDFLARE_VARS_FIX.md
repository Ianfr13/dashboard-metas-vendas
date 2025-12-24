## 🔧 Corrigindo o Erro 401 (Unauthorized)

O erro `401` acontece porque a **anon key** do Supabase não está configurada corretamente no Cloudflare Pages. O frontend precisa dela para se comunicar com o Supabase.

### **Passo a Passo para Corrigir:**

1.  **Acesse o Dashboard do Cloudflare:**
    -   https://dash.cloudflare.com/
    -   Vá para **Workers & Pages** → **dashboard-metas-vendas**

2.  **Vá para as Configurações:**
    -   Clique em **Settings** → **Environment variables**

3.  **Adicione a Variável de Ambiente:**
    -   Clique em **Add variable**
    -   **Variable name:** `VITE_SUPABASE_ANON_KEY`
    -   **Value:**
        ```
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTIzNDMsImV4cCI6MjA4MjE4ODM0M30.GfjckpNB1l-LSgvjOqJaMCs1iyNEByuCF2rBv4As0OY
        ```

4.  **Salve e Faça o Redeploy:**
    -   Clique em **Save**
    -   Vá para a aba **Deployments** e clique em **Retry deployment** na última build.

*[IMAGEM: Tela de variáveis de ambiente no Cloudflare com a VITE_SUPABASE_ANON_KEY preenchida]*

### **Por que isso é necessário?**

-   O Supabase client no frontend precisa da **anon key** para inicializar.
-   Mesmo que as Edge Functions sejam seguras, o cliente precisa se identificar para o Supabase.
-   O prefixo `VITE_` é obrigatório para o Vite expor a variável ao frontend.

### **Após a Correção:**

1.  Aguarde o novo deploy (2-3 minutos).
2.  Limpe o cache do navegador.
3.  Acesse https://dashboard.douravita.com.br e tente fazer o login novamente.

**Agora o erro 401 deve desaparecer e o login funcionar!** 🎉
