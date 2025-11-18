# Plano de Correcao - BUG-001: Avatar Vazio Apos Upload

## Metadata
- **Bug ID:** BUG-001
- **Severidade:** BAIXA
- **Prioridade:** MEDIA
- **Status:** AGUARDANDO CORRECAO
- **Data de Identificacao:** 2025-10-20
- **Estimativa:** 2 horas
- **Responsavel:** Claude Code Agent (Desenvolvimento)

---

## Descricao do Problema

Apos realizar upload de nova imagem de avatar, o elemento visual no header aparece como um circulo vazio/branco ao inves de exibir a imagem enviada. O sistema confirma que o upload foi bem-sucedido (mensagem de sucesso exibida e dados persistidos no banco), mas a visualizacao nao e atualizada imediatamente no navegador.

### Evidencias
- Screenshot: `test5-avatar-atualizado.png` - mostra avatar vazio
- Screenshot: `test6-persistencia-apos-refresh.png` - mostra avatar vazio persistente
- Alt text correto: "Avatar - Usuario E2E Test Final"
- Console: Sem erros JavaScript reportados

---

## Analise Tecnica

### Causa Raiz Provavel
1. **Cache do Navegador**: Navegador mantendo versao antiga da imagem em cache
2. **Falta de Cache-Busting**: URL da imagem permanece identica apos upload
3. **Componente nao Re-renderiza**: Frontend nao atualiza src da imagem

### Arquivos Afetados

#### Backend
- `controllers/userController.js` ou `controllers/uploadController.js`
  - Funcao de upload de avatar
  - Response apos upload bem-sucedido

#### Frontend
- `public/js/avatar-handler.js` ou equivalente
  - Logica de upload
  - Callback de sucesso
  - Atualizacao da imagem no DOM

#### Views
- `views/partials/header.hbs`
  - Renderizacao do avatar
  - Tag `<img>` do avatar

---

## Solucao Proposta

### Correcao 1: Implementar Cache-Busting (RECOMENDADO)

#### Localizacao
`controllers/userController.js` (ou arquivo equivalente)

#### Antes (com bug)
```javascript
async uploadAvatar(req, res) {
  try {
    // ... codigo de upload ...

    // Salvar no banco
    await db.query(
      'UPDATE users SET profile_picture_url = $1 WHERE id = $2',
      [filename, userId]
    );

    res.json({
      success: true,
      message: 'Avatar atualizado com sucesso'
    });
  } catch (error) {
    // ... tratamento de erro ...
  }
}
```

#### Depois (corrigido)
```javascript
async uploadAvatar(req, res) {
  try {
    // ... codigo de upload ...

    // Gerar timestamp para cache-busting
    const timestamp = Date.now();

    // Salvar no banco
    await db.query(
      'UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2',
      [filename, userId]
    );

    // Retornar URL completa com timestamp
    res.json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      avatarUrl: `/uploads/${filename}?v=${timestamp}`
    });
  } catch (error) {
    // ... tratamento de erro ...
  }
}
```

### Correcao 2: Atualizar Frontend

#### Localizacao
`public/js/avatar-handler.js` (ou arquivo equivalente)

#### Antes (com bug)
```javascript
async function uploadAvatar(formData) {
  const response = await fetch('/api/upload-avatar', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    showSuccessMessage(data.message);
    // Modal fecha mas avatar nao atualiza
    closeModal();
  }
}
```

#### Depois (corrigido)
```javascript
async function uploadAvatar(formData) {
  const response = await fetch('/api/upload-avatar', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    showSuccessMessage(data.message);

    // Atualizar avatar no header
    updateAvatarDisplay(data.avatarUrl);

    closeModal();
  }
}

function updateAvatarDisplay(newAvatarUrl) {
  const avatarImg = document.querySelector('.avatar-image');
  if (avatarImg) {
    // Forcar reload com novo URL
    avatarImg.src = newAvatarUrl || avatarImg.src.split('?')[0] + '?t=' + Date.now();

    // Disparar evento de atualizacao
    avatarImg.dispatchEvent(new Event('load'));
  }
}
```

### Correcao 3: Alternativa - Forcar Reload da Pagina

#### Localizacao
`public/js/avatar-handler.js`

#### Implementacao
```javascript
async function uploadAvatar(formData) {
  const response = await fetch('/api/upload-avatar', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    showSuccessMessage(data.message);

    // Aguardar mensagem ser vista
    setTimeout(() => {
      // Recarregar pagina para mostrar novo avatar
      window.location.reload();
    }, 1500);
  }
}
```

---

## Checklist de Implementacao

### Fase 1: Preparacao
- [ ] Fazer backup dos arquivos a serem modificados
- [ ] Criar branch para a correcao: `fix/bug-001-avatar-cache`
- [ ] Identificar arquivos exatos a modificar
- [ ] **STATUS:** NAO INICIADO

### Fase 2: Implementacao Backend
- [ ] Modificar endpoint de upload de avatar
- [ ] Adicionar timestamp ao response JSON
- [ ] Incluir URL completa da imagem no response
- [ ] Atualizar campo `updated_at` no banco de dados
- [ ] Testar endpoint com Postman/Insomnia
- [ ] **STATUS:** NAO INICIADO

### Fase 3: Implementacao Frontend
- [ ] Criar funcao `updateAvatarDisplay()`
- [ ] Atualizar callback de sucesso do upload
- [ ] Implementar cache-busting no src da imagem
- [ ] Adicionar loading state durante upload
- [ ] Testar funcao isoladamente
- [ ] **STATUS:** NAO INICIADO

### Fase 4: Validacao
- [ ] Executar testes E2E novamente
- [ ] Verificar avatar atualiza imediatamente
- [ ] Testar em Chrome
- [ ] Testar em Firefox
- [ ] Testar em Safari (se disponivel)
- [ ] Verificar sem erros de console
- [ ] **STATUS:** NAO INICIADO

### Fase 5: Deploy
- [ ] Commit com mensagem: `fix(avatar): adiciona cache-busting para atualizacao imediata do avatar`
- [ ] Push para repositorio
- [ ] Criar Pull Request
- [ ] Aguardar review
- [ ] Merge para main
- [ ] **STATUS:** NAO INICIADO

---

## Testes de Validacao

### Teste 1: Upload e Visualizacao Imediata
```
1. Fazer login no sistema
2. Clicar no avatar
3. Clicar no botao de camera
4. Selecionar nova imagem
5. Clicar em "Enviar"
6. VERIFICAR: Avatar deve mostrar nova imagem IMEDIATAMENTE (sem refresh)
```

**Resultado Esperado:**
- Avatar atualizado instantaneamente
- Nenhum circulo vazio/branco
- Imagem correta exibida

### Teste 2: Multiplos Uploads Sequenciais
```
1. Fazer upload da imagem A
2. Verificar visualizacao
3. Imediatamente fazer upload da imagem B
4. Verificar visualizacao
5. VERIFICAR: Avatar deve mostrar imagem B (nao A)
```

**Resultado Esperado:**
- Cada upload atualiza corretamente
- Nenhum conflito de cache
- Sempre mostra a ultima imagem enviada

### Teste 3: Persistencia Apos Refresh
```
1. Fazer upload de nova imagem
2. Verificar visualizacao imediata
3. Pressionar F5 (refresh)
4. VERIFICAR: Avatar deve manter a mesma imagem
```

**Resultado Esperado:**
- Avatar persiste apos refresh
- Mesma imagem antes e depois do F5

### Teste 4: Compatibilidade de Navegadores
```
Executar Teste 1 em:
- Chrome
- Firefox
- Safari
- Edge
```

**Resultado Esperado:**
- Funcionalidade consistente em todos os navegadores

---

## Codigo Completo da Correcao

### Arquivo: `controllers/userController.js`

```javascript
const uploadAvatar = async (req, res) => {
  try {
    // Verificar se usuario esta autenticado
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario nao autenticado'
      });
    }

    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    const userId = req.session.userId;
    const filename = req.file.filename;
    const timestamp = Date.now();

    // Atualizar banco de dados
    const result = await db.query(
      'UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2 RETURNING name',
      [filename, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado'
      });
    }

    // Atualizar sessao
    req.session.profilePicture = filename;

    // Retornar sucesso com URL completa
    res.json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      avatarUrl: `/uploads/${filename}?v=${timestamp}`,
      filename: filename,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar avatar'
    });
  }
};

module.exports = {
  uploadAvatar
};
```

### Arquivo: `public/js/avatar-handler.js`

```javascript
// Funcao principal de upload
async function uploadAvatar(formData) {
  try {
    // Mostrar loading
    showLoadingState();

    // Fazer upload
    const response = await fetch('/upload-avatar', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      // Atualizar avatar imediatamente
      updateAvatarDisplay(data.avatarUrl);

      // Mostrar mensagem de sucesso
      showSuccessMessage(data.message);

      // Fechar modal apos breve delay
      setTimeout(() => {
        closeModal();
      }, 1000);
    } else {
      showErrorMessage(data.message || 'Erro ao atualizar avatar');
    }

  } catch (error) {
    console.error('Erro no upload:', error);
    showErrorMessage('Erro ao conectar com o servidor');
  } finally {
    hideLoadingState();
  }
}

// Atualizar avatar no header
function updateAvatarDisplay(newAvatarUrl) {
  // Buscar elemento do avatar
  const avatarImg = document.querySelector('.avatar-image');

  if (avatarImg && newAvatarUrl) {
    // Criar nova URL com timestamp para cache-busting
    const urlWithTimestamp = newAvatarUrl.includes('?')
      ? newAvatarUrl
      : `${newAvatarUrl}?v=${Date.now()}`;

    // Atualizar src
    avatarImg.src = urlWithTimestamp;

    // Atualizar alt text se necessario
    avatarImg.alt = 'Avatar atualizado';

    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('avatarUpdated', {
      detail: { url: urlWithTimestamp }
    }));
  }
}

// Estados de loading
function showLoadingState() {
  const uploadBtn = document.querySelector('#upload-button');
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span>Enviando...</span>';
  }
}

function hideLoadingState() {
  const uploadBtn = document.querySelector('#upload-button');
  if (uploadBtn) {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<span>Enviar</span>';
  }
}
```

---

## Tracking de Progresso

| Etapa | Status | Responsavel | Inicio | Conclusao | Observacoes |
|-------|--------|-------------|--------|-----------|-------------|
| Preparacao | NAO INICIADO | Claude Code | - | - | - |
| Backend | NAO INICIADO | Claude Code | - | - | - |
| Frontend | NAO INICIADO | Claude Code | - | - | - |
| Validacao | NAO INICIADO | E2E Testing | - | - | - |
| Deploy | NAO INICIADO | DevOps | - | - | - |

---

## Processo de Correcao

### Para Claude Code Agent:

1. **Ler este plano de correcao**
2. **Identificar arquivos exatos no projeto**
3. **Implementar correcoes na ordem:**
   - Backend primeiro (response com URL)
   - Frontend depois (atualizar DOM)
4. **Para cada correcao completada:**
   - Marcar checkbox como [x] completado
   - Atualizar STATUS para COMPLETADO
   - Adicionar timestamp de conclusao
   - Fazer commit: `fix(avatar): [descricao]`
5. **Apos todas as correcoes:**
   - Atualizar status geral para AGUARDANDO RE-TESTE
   - Notificar E2E Testing Agent

### Exemplo de Atualizacao:
```markdown
#### Fase 2: Implementacao Backend
- [x] Modificar endpoint de upload de avatar
- [x] Adicionar timestamp ao response JSON
- [x] Incluir URL completa da imagem no response
- [x] Atualizar campo updated_at no banco de dados
- [x] Testar endpoint com Postman/Insomnia
- [x] **STATUS:** COMPLETADO em 2025-10-21 10:30
```

---

## Re-teste Apos Correcao

Apos implementacao das correcoes, executar:

```bash
# Re-executar apenas os testes relacionados ao avatar
npm run test:e2e -- --grep "avatar"

# Ou executar todos os testes E2E
npm run test:e2e
```

### Criterios de Aceitacao:
- [ ] Avatar atualiza imediatamente apos upload (sem refresh)
- [ ] Nenhum circulo vazio/branco aparece
- [ ] Imagem correta exibida
- [ ] Funciona em Chrome, Firefox, Safari
- [ ] Sem erros de console
- [ ] Persistencia mantida apos refresh

---

## Status Atual

**AGUARDANDO CORRECAO**

Proximo status esperado: **AGUARDANDO RE-TESTE**
Status final esperado: **VALIDADO**

---

## Notas Importantes

1. Nao fazer commits parciais - completar toda a correcao antes de commitar
2. Testar localmente antes de fazer push
3. Se encontrar problemas adicionais, documentar aqui
4. Mantenha este arquivo atualizado durante a implementacao

---

**Plano criado por:** E2E Testing Specialist Agent
**Data:** 2025-10-20 22:50 UTC
**Versao:** 1.0
