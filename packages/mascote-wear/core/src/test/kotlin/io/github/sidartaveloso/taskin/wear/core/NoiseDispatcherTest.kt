package io.github.sidartaveloso.taskin.wear.core

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/** O que a tabela nao cobre: os assinantes de nivel e o isolamento entre ouvintes. */
class NoiseDispatcherTest {
    @Test
    fun `entrega o ultimo nivel na inscricao e a cada amostra, ate cancelar`() {
        val dispatcher = NoiseDispatcher()
        dispatcher.dispatch(0.3, 0.0)
        val niveis = mutableListOf<Double>()

        val cancelar = dispatcher.subscribeLevel { niveis += it }
        dispatcher.dispatch(0.7, 10.0)
        cancelar()
        dispatcher.dispatch(0.9, 20.0)

        assertEquals(listOf(0.3, 0.7), niveis)
        assertEquals(0.9, dispatcher.currentLevel)
    }

    @Test
    fun `um ouvinte que lanca excecao nao impede os outros`() {
        val dispatcher = NoiseDispatcher()
        var chamados = 0
        dispatcher.onNoiseAbove(0.5) { error("quebrado") }
        dispatcher.onNoiseAbove(0.5) { chamados++ }
        dispatcher.subscribeLevel { error("quebrado") }

        dispatcher.dispatch(0.9, 0.0)

        assertEquals(1, chamados)
    }
}
