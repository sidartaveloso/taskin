package io.github.sidartaveloso.taskin.wear.core

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import kotlin.math.hypot

class EncaixeTest {
    @ParameterizedTest
    @ValueSource(floats = [432f, 454f, 480f])
    fun `o desenho inteiro cabe no circulo da tela, com os quatro cantos dentro`(lado: Float) {
        val e = encaixarNoCirculo(larguraDoDesenho = 320f, alturaDoDesenho = 260f, ladoDaTela = lado)
        val raio = lado / 2
        val cantos = listOf(0f to 0f, 320f to 0f, 0f to 260f, 320f to 260f)
        for ((x, y) in cantos) {
            val px = e.deslocamentoX + x * e.escala
            val py = e.deslocamentoY + y * e.escala
            assertTrue(hypot(px - raio, py - raio) <= raio, "canto ($x, $y) fora do circulo de $lado px")
        }
    }

    @ParameterizedTest
    @ValueSource(floats = [432f, 454f, 480f])
    fun `o desenho fica centrado`(lado: Float) {
        val e = encaixarNoCirculo(320f, 260f, lado)
        assertEquals(lado / 2, e.deslocamentoX + 160f * e.escala, 0.001f)
        assertEquals(lado / 2, e.deslocamentoY + 130f * e.escala, 0.001f)
    }

    @ParameterizedTest
    @ValueSource(floats = [432f, 454f, 480f])
    fun `aproveita a tela, sem encolher mais que a folga`(lado: Float) {
        val e = encaixarNoCirculo(320f, 260f, lado, folga = 0.04f)
        val diagonal = hypot(320f, 260f) * e.escala
        assertEquals(lado * (1 - 0.04f), diagonal, 0.01f)
    }
}
