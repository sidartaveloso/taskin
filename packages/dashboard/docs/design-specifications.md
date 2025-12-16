# Design Specifications - Taskin Dashboard

## Color Palette

### Backgrounds

```css
--background-body: rgb(229, 239, 249); /* Fundo geral azul claro */
--background-card: rgb(255, 255, 255); /* Fundo dos cards */
--background-header: rgb(39, 110, 173); /* Header azul escuro */
--background-header-dark: rgb(14, 58, 102); /* Header variante escura */
--background-alert-error: rgb(230, 128, 128); /* Alerta vermelho claro */
--background-section-light: rgb(232, 242, 252); /* Seção azul claro */
--background-section-warning: rgb(240, 235, 213); /* Seção amarelo claro */
--background-section-error: rgb(249, 233, 233); /* Seção vermelho claro */
--background-progress: rgb(200, 217, 232); /* Barra de progresso fundo */
--background-badge: rgb(176, 199, 219); /* Badge azul */
--overlay: rgba(255, 255, 255, 0.5); /* Overlay translúcido */
--shadow-base: rgba(0, 0, 0, 0.15); /* Sombra base */
```

### Text Colors

```css
--text-primary: rgb(0, 0, 0); /* Texto principal preto */
--text-link: rgb(13, 68, 119); /* Links azul escuro */
--text-link-light: rgb(182, 205, 227); /* Links azul claro */
--text-error: rgb(255, 0, 0); /* Texto erro vermelho */
--text-error-bg: rgb(253, 241, 241); /* Fundo texto erro */
--text-secondary: rgb(45, 48, 56); /* Texto secundário */
--text-muted: rgb(108, 153, 195); /* Texto esmaecido azul */
--text-warning: rgb(187, 128, 71); /* Texto alerta marrom */
--text-warning-light: rgb(202, 156, 96); /* Alerta marrom claro */
--text-danger: rgb(196, 92, 92); /* Texto perigo vermelho */
--text-danger-alt: rgb(210, 92, 92); /* Variante perigo */
--text-info: rgb(76, 120, 152); /* Texto informação azul */
--text-white: rgb(255, 255, 255); /* Texto branco */
--text-header: rgb(11, 45, 80); /* Texto header azul escuro */
--text-header-link: rgb(10, 78, 149); /* Link header azul */
--text-success: rgb(0, 146, 19); /* Texto sucesso verde */
--text-warning-dark: rgb(182, 120, 14); /* Alerta marrom escuro */
--text-error-dark: rgb(208, 58, 58); /* Erro vermelho escuro */
```

### Border Colors

```css
--border-default: rgb(128, 128, 128); /* Borda padrão cinza */
--border-link: rgb(13, 68, 119); /* Borda links */
--border-muted: rgb(182, 205, 227); /* Borda esmaecida */
```

### Box Shadows

```css
--shadow-header:
  rgb(0, 0, 0) 0px -2px 10px 4px, rgb(19, 85, 146) 0px -4px 14px -4px inset,
  rgb(24, 96, 162) 0px -6px 50px 0px inset;

--shadow-card: rgba(0, 0, 0, 0.5) 0px 0px 15px 0px;

--shadow-section-light: rgb(232, 242, 252) -3.55px -21.3px 28.4px 0px inset;
--shadow-section-warning: rgb(240, 235, 213) -3.55px -21.3px 28.4px 0px inset;
--shadow-section-error: rgb(249, 233, 233) -3.55px -21.3px 28.4px 0px inset;
```

## Typography

### Font Family

```css
--font-family: 'Ubuntu', 'Roboto', arial, sans-serif;
```

### Font Sizes (ordenados por tamanho)

```css
--font-size-xs: 12.78px; /* ~13px - Extra small */
--font-size-sm: 13.5px; /* ~13-14px - Small */
--font-size-base: 14.2px; /* ~14px - Base */
--font-size-md: 16px; /* Medium - Padrão browser */
--font-size-lg: 18.46px; /* ~18px - Large */
--font-size-xl: 21.3px; /* ~21px - Extra large */
--font-size-2xl: 24.14px; /* ~24px - 2X large */
--font-size-3xl: 28.4px; /* ~28px - 3X large */
```

## Layout Structure (observado no screenshot)

### Card Components

#### Card Container

- Background: branco (`--background-card`)
- Shadow: `--shadow-card` (sombra pronunciada)
- Border-radius: ~8-10px (arredondado)
- Padding: ~16px
- Margin entre cards: ~16px
- Border: 2-3px solid em cores de status

#### Task Number Badge (canto superior esquerdo)

- Background: azul escuro (`--background-header-dark`)
- Color: branco
- Font-size: ~20-24px (`--font-size-2xl`)
- Font-weight: bold
- Padding: 8px 16px
- Border-radius: 4-6px
- Position: Absolute no canto superior esquerdo

#### Warning Badge (canto superior esquerdo, quando aplicável)

- Background: vermelho (`--background-alert-error`)
- Color: branco/preto
- Icon: ⚠️ (warning triangle)
- Font-size: ~14px
- Padding: 4px 8px
- Border-radius: 4px
- Display: Badge count (ex: "+154", "+23", "+56")

#### Avatar (header do card)

- Size: ~60-80px (grande e proeminente)
- Border-radius: 50% (circular)
- Position: Topo do card, centralizado ou à esquerda

#### Task Title

- Font-size: ~16-18px (`--font-size-lg`)
- Font-weight: 600-700 (semi-bold/bold)
- Color: texto primário
- Max-lines: 2-3 com ellipsis
- Margin-bottom: 8px

#### Project Breadcrumb

- Font-size: ~12-13px (`--font-size-xs`)
- Color: link azul (`--text-link`)
- Separator: ">" ou "/"
- Display: inline com wrapping
- Margin-bottom: 12px

#### Dates Section

- Display: Flex row com gap
- Icons: + (plus) e 🏁 (finish flag)
- Font-size: ~14px
- Color: texto secundário
- Background: azul muito claro
- Padding: 4px 8px
- Border-radius: 4px

#### Estimates Section

- Label: "Estimativas:"
- Display: Horizontal com espaçamento
- Font-size: ~14px
- Colors:
  - Verde: tempo dentro do estimado
  - Laranja: tempo médio
  - Vermelho: tempo excedido
- Format: "Xh" ou "Xhh"

#### Projection Section

- Label: "Projeção:"
- Display: Com emoji indicador (😊 verde, 😟 vermelho)
- Font-size: ~14px
- Format: "+Xh" ou "-Xh"

#### Progress Bar

- Height: ~24-32px
- Background: azul claro (`--background-progress`)
- Fill: Status-dependent color
- Border-radius: 4px
- Text overlay: "Concluído: X% em Xh"
- Font-size: ~13px
- Color: branco (quando em background escuro)

#### Week Days Bar (header)

- Display: Table/Grid com 7 colunas (Qui-Qua)
- Cell background: alternating light colors
- Font-size: ~12px
- Padding: 4px
- Border-radius: 2px em cada célula
- Colors: Status-based (weekend vs weekday)

### Grid Layout

- Columns: 3 columns no desktop (visível no screenshot)
- Gap: ~16px horizontal, ~24px vertical
- Responsive: adaptar para 2 cols (tablet) e 1 col (mobile)
- Container padding: ~24px
- Background: azul claro (`--background-body`)

## Status Colors (inferido dos badges e progress)

```css
/* Status: In Progress */
--status-progress-bg: rgb(39, 110, 173); /* Azul escuro */
--status-progress-text: rgb(255, 255, 255); /* Branco */

/* Status: Warning/Blocked */
--status-warning-bg: rgb(230, 128, 128); /* Vermelho claro */
--status-warning-text: rgb(196, 92, 92); /* Vermelho escuro */

/* Status: Success/Done */
--status-success-bg: rgb(0, 146, 19); /* Verde */
--status-success-text: rgb(255, 255, 255); /* Branco */

/* Status: Paused */
--status-paused-bg: rgb(187, 128, 71); /* Marrom/laranja */
--status-paused-text: rgb(255, 255, 255); /* Branco */
```

## Key Visual Characteristics

1. **Compact Information Density**: Muita informação em pouco espaço
2. **Color-coded Elements**: Uso intenso de cores para status e categorias
3. **Strong Shadows**: Sombras pronunciadas nos cards (depth)
4. **Rounded Corners**: Border-radius consistente em todos elementos
5. **Icon Usage**: Emojis e ícones para indicadores visuais
6. **Progress Visibility**: Barras de progresso proeminentes
7. **Avatar Prominence**: Avatares grandes e visíveis
8. **Week Grid Header**: Visualização clara da semana de trabalho
9. **Badge System**: Badges numerados e de alerta visíveis
10. **Blue Theme**: Paleta predominantemente azul com acentos

## Responsive Breakpoints (recomendado)

```css
/* Desktop Large - 4 columns */
@media (min-width: 1600px) {
  grid-template-columns: repeat(4, 1fr);
}

/* Desktop - 3 columns (screenshot atual) */
@media (min-width: 1200px) {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet - 2 columns */
@media (min-width: 768px) and (max-width: 1199px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile - 1 column */
@media (max-width: 767px) {
  grid-template-columns: 1fr;
}
```

## Implementation Priority

### Phase 1 (Critical)

1. ✅ Paleta de cores CSS variables
2. ✅ Tipografia base
3. ✅ Card shadows e borders
4. ✅ Badge styling
5. ✅ Progress bar visual

### Phase 2 (Important)

6. Week days grid component
7. Avatar sizing e styling
8. Task number badge positioning
9. Warning/alert badges
10. Icon system (emojis)

### Phase 3 (Enhancement)

11. Animations e transitions
12. Hover states
13. Loading states
14. Empty states styling
15. Print optimizations
