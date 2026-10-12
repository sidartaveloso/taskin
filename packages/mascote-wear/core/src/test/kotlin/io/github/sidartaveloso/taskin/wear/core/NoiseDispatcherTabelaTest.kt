package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory

/**
 * O detector em Kotlin contra a mesma tabela que o `createNoiseDispatcher` do
 * TypeScript percorre. Caso que falta aqui entra la, e nao so deste lado.
 */
class NoiseDispatcherTabelaTest {
    private val casos = TabelaCompartilhada.casos("packages/ui-sense/src/utils/__fixtures__/noise-dispatcher.cases.json")

    @TestFactory
    fun `cada caso da tabela`(): List<DynamicTest> {
        assertTrue(casos.isNotEmpty())
        return casos.map { caso -> DynamicTest.dynamicTest(caso.getValue("nome").toString()) { rodar(caso) } }
    }

    private fun rodar(caso: JsonObject) {
        val dispatcher = NoiseDispatcher()
        val disparos = mutableListOf<Double>()
        val progresso = mutableListOf<Pair<Double, NoiseProgress>>()
        var agora = 0.0

        val acompanhar = caso["trackProgress"]?.asBoolean() == true
        val timing = caso["timing"]
        val opcoes =
            when {
                timing.isNullish() -> NoiseThresholdOptions()
                timing is JsonPrimitive -> NoiseThresholdOptions(debounceMs = timing.asDouble())
                else -> {
                    val o = timing!!.jsonObject
                    NoiseThresholdOptions(
                        debounceMs = o["debounceMs"]?.asDouble() ?: DEFAULT_NOISE_DEBOUNCE_MS,
                        sustainMs = o["sustainMs"]?.asDouble() ?: DEFAULT_NOISE_SUSTAIN_MS,
                        sustainRatio = o["sustainRatio"]?.asDouble() ?: DEFAULT_NOISE_SUSTAIN_RATIO,
                        onProgress = if (acompanhar) { p -> progresso += agora to p } else null,
                    )
                }
            }
        val cancelar = dispatcher.onNoiseAbove(caso.getValue("threshold").asDouble(), opcoes) { disparos += agora }
        val cancelarEm = caso["unsubscribeAt"]?.asDouble()

        for (amostra in caso.getValue("samples").jsonArray) {
            val (t, rms) = amostra.asDoubleList()
            if (cancelarEm != null && t >= cancelarEm) cancelar()
            agora = t
            dispatcher.dispatch(rms, t)
        }

        val esperado = caso.getValue("expected").jsonObject
        assertEquals(esperado.getValue("fires").asDoubleList(), disparos, "disparos")
        assertEquals(esperado.getValue("lastLevel").asDouble(), dispatcher.currentLevel, "ultimo nivel")

        val progressoEsperado = esperado["progress"]?.jsonArray ?: return
        assertEquals(progressoEsperado.size, progresso.size, "quantidade de relatos de progresso")
        progressoEsperado.zip(progresso).forEachIndexed { i, (e, obtido) ->
            val (t, p) = obtido
            val o = e.jsonObject
            val onde = "progresso #$i (t=$t)"
            assertEquals(o.getValue("t").asDouble(), t, onde)
            assertEquals(o.getValue("ratio").asDouble(), p.ratio, TOLERANCIA, "$onde ratio")
            assertEquals(o.getValue("requiredRatio").asDouble(), p.requiredRatio, TOLERANCIA, "$onde requiredRatio")
            assertEquals(o.getValue("msUntilWindowFull").asDouble(), p.msUntilWindowFull, TOLERANCIA, "$onde msUntilWindowFull")
            assertEquals(o.getValue("msUntilDebounceOver").asDouble(), p.msUntilDebounceOver, TOLERANCIA, "$onde msUntilDebounceOver")
            val previsao = o["msUntilFire"]
            if (previsao.isNullish()) {
                assertNull(p.msUntilFire, "$onde msUntilFire")
            } else {
                assertEquals(previsao!!.asDouble(), p.msUntilFire!!, TOLERANCIA, "$onde msUntilFire")
            }
        }
    }

    private companion object {
        const val TOLERANCIA = 1e-9
    }
}
