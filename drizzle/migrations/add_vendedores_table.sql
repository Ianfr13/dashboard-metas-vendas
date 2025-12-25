-- Tabela de Vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  tipo ENUM('closer', 'sdr', 'gestor') NOT NULL DEFAULT 'closer',
  ativo INT NOT NULL DEFAULT 1,
  meta_mensal DECIMAL(12, 2) DEFAULT NULL,
  comissao_percentual DECIMAL(5, 2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Vendas por Vendedor
CREATE TABLE IF NOT EXISTS vendas_vendedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendedor_id INT NOT NULL,
  gtm_event_id INT,
  transaction_id VARCHAR(255),
  valor DECIMAL(12, 2) NOT NULL,
  produto_nome VARCHAR(255),
  data_venda TIMESTAMP NOT NULL,
  origem ENUM('gtm', 'webhook', 'manual') NOT NULL DEFAULT 'gtm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_vendedor_ativo ON vendedores(ativo);
CREATE INDEX idx_vendas_vendedor_id ON vendas_vendedor(vendedor_id);
CREATE INDEX idx_vendas_data ON vendas_vendedor(data_venda);
CREATE INDEX idx_vendas_transaction ON vendas_vendedor(transaction_id);
