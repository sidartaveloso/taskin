package io.github.sidartaveloso.taskin.wear

import android.content.Context
import androidx.core.content.edit
import io.github.sidartaveloso.taskin.wear.core.PortaDeArmazenamento

/**
 * O bloco `mascot` guardado no relogio, em `SharedPreferences`.
 *
 * Uma chave so, com o texto do bloco: e o equivalente do `localStorage` do
 * PWA, e a porta do `core` e sincrona como ele. O DataStore seria a escolha
 * para estado que cresce ou que varias telas observam; aqui e um texto pequeno,
 * lido ao abrir e gravado ao fechar a tela de ajustes.
 */
class ArmazenamentoDoRelogio(
    contexto: Context,
) : PortaDeArmazenamento {
    private val preferencias = contexto.getSharedPreferences("taskin-mascote", Context.MODE_PRIVATE)

    override fun ler(): String? = preferencias.getString(CHAVE, null)

    override fun gravar(valor: String) = preferencias.edit { putString(CHAVE, valor) }

    private companion object {
        /** A mesma chave do PWA, para quem procurar os dois. */
        const val CHAVE = "taskin-mascote:mascot"
    }
}
