---
'@opentask/taskin-design-vue': patch
---

As tabelas da documentacao passam a renderizar

O MDX do Storybook e CommonMark puro, e tabela em pipe nao e markdown padrao —
e GitHub Flavored Markdown. Sem o `remark-gfm` a tabela do `welcome.mdx` saia na
tela como um paragrafo de pipes e tracos, **sem erro nenhum** no console nem no
terminal. E o pior tipo de falha: parece texto mal escrito, nao configuracao
faltando.

O `@storybook/addon-docs` da raiz passa a declarar o plugin em
`mdxPluginOptions.mdxCompileOptions.remarkPlugins`. Vale para qualquer `.mdx`
que a galeria venha a ter.
