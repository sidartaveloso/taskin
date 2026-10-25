package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory
import org.junit.jupiter.api.assertThrows

/** `resolveMascotNoiseSettings` contra a tabela que o TypeScript tambem percorre. */
class MascotNoiseSettingsTabelaTest {
    private val casos = TabelaCompartilhada.casos("packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json")

    @TestFactory
    fun `cada caso da tabela`(): List<DynamicTest> =
        casos.map { caso -> DynamicTest.dynamicTest(caso.getValue("nome").jsonPrimitive.content) { rodar(caso) } }

    private fun rodar(caso: JsonObject) {
        val mascot = caso["mascot"]
        val esperado = caso.getValue("expected").jsonObject

        if (esperado.containsKey("invalid")) {
            assertThrows<ConfiguracaoInvalida> { resolveMascotNoiseSettings(mascot) }
            return
        }

        val s = esperado.getValue("settings").jsonObject
        val obtido = resolveMascotNoiseSettings(mascot)
        assertEquals(
            MascotNoiseSettings(
                enabled = s.getValue("enabled").asBoolean(),
                threshold = s.getValue("threshold").asDouble(),
                debounceMs = s.getValue("debounceMs").asDouble().toLong(),
                sound = s.getValue("sound").asBoolean(),
                sustainMs = s.getValue("sustainMs").asDouble().toLong(),
                sustainRatio = s.getValue("sustainRatio").asDouble(),
                name = (s.getValue("name") as JsonPrimitive).content,
                phrase = (s.getValue("phrase") as JsonPrimitive).content,
                volume = s.getValue("volume").asDouble(),
            ),
            obtido,
        )
    }
}
