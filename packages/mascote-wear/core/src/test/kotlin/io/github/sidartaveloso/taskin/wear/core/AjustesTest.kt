package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

/** O mesmo comportamento de `packages/mascote/src/composables/ajustes.ts`, no relogio. */
class AjustesTest {
    private class Memoria(var valor: String? = null) : PortaDeArmazenamento {
        override fun ler() = valor

        override fun gravar(valor: String) {
            this.valor = valor
        }
    }

    private fun bloco(texto: String): JsonObject = Json.parseToJsonElement(texto).jsonObject

    private val padroes = resolveMascotNoiseSettings(null)

    @Test
    fun `sem nada gravado valem os padroes`() {
        assertEquals(padroes, lerAjustes(Memoria()))
        assertEquals(padroes, lerAjustes(null))
    }

    @Test
    fun `JSON quebrado cai nos padroes`() {
        assertEquals(padroes, lerAjustes(Memoria("{nao e json")))
    }

    @Test
    fun `bloco gravado fora da faixa cai nos padroes`() {
        assertEquals(padroes, lerAjustes(Memoria("""{"reactions":{"noise":{"threshold":7}}}""")))
    }

    @Test
    fun `armazenamento que falha ao ler cai nos padroes`() {
        val quebrado =
            object : PortaDeArmazenamento {
                override fun ler(): String = error("negado")

                override fun gravar(valor: String) = error("negado")
            }
        assertEquals(padroes, lerAjustes(quebrado))
    }

    @Test
    fun `grava o bloco no formato do arquivo e le de volta o mesmo ajuste`() {
        val memoria = Memoria()
        val gravado = gravarAjustes(memoria, bloco("""{"reactions":{"noise":{"enabled":true,"name":"Joris"}}}"""))

        assertEquals(true, gravado.enabled)
        assertEquals("Joris", gravado.name)
        assertEquals(bloco("""{"reactions":{"noise":{"enabled":true,"name":"Joris"}}}"""), bloco(memoria.valor!!))
        assertEquals(gravado, lerAjustes(memoria))
    }

    @Test
    fun `recusa o bloco invalido antes de gravar`() {
        val memoria = Memoria()
        assertThrows<ConfiguracaoInvalida> { gravarAjustes(memoria, bloco("""{"reactions":{"noise":{"volume":2}}}""")) }
        assertNull(memoria.valor)
    }

    @Test
    fun `armazenamento que falha ao gravar nao recusa a mudanca`() {
        val quebrado =
            object : PortaDeArmazenamento {
                override fun ler(): String? = null

                override fun gravar(valor: String) = error("cheio")
            }
        assertEquals(true, gravarAjustes(quebrado, bloco("""{"reactions":{"noise":{"enabled":true}}}""")).enabled)
    }

    @Test
    fun `o bloco montado dos ajustes resolve para os mesmos ajustes`() {
        val ajustes = padroes.copy(enabled = true, name = "Joris", sustainMs = 2000)
        assertEquals(ajustes, resolveMascotNoiseSettings(blocoDe(ajustes)))
    }

    @Test
    fun `o bloco como texto e JSON que se cola num taskin json`() {
        val ajustes = padroes.copy(enabled = true)
        val texto = blocoComoTexto(blocoDe(ajustes))
        assertEquals(ajustes, resolveMascotNoiseSettings(Json.parseToJsonElement(texto)))
    }
}
