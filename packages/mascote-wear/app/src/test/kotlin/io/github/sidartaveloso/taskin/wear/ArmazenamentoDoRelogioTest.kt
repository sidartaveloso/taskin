package io.github.sidartaveloso.taskin.wear

import androidx.test.core.app.ApplicationProvider
import io.github.sidartaveloso.taskin.wear.core.gravarAjustes
import io.github.sidartaveloso.taskin.wear.core.lerAjustes
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ArmazenamentoDoRelogioTest {
    private val contexto = ApplicationProvider.getApplicationContext<android.content.Context>()

    @Test
    fun `comeca vazio`() {
        assertNull(ArmazenamentoDoRelogio(contexto).ler())
    }

    @Test
    fun `o que se grava sobrevive a uma nova instancia, como sobrevive a reabrir o app`() {
        val bloco = Json.parseToJsonElement("""{"reactions":{"noise":{"enabled":true,"name":"Joris"}}}""").jsonObject
        gravarAjustes(ArmazenamentoDoRelogio(contexto), bloco)

        val lido = lerAjustes(ArmazenamentoDoRelogio(contexto))

        assertEquals(true, lido.enabled)
        assertEquals("Joris", lido.name)
    }
}
