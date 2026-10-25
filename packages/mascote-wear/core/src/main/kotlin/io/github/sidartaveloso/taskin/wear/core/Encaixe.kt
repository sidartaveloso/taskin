package io.github.sidartaveloso.taskin.wear.core

import kotlin.math.hypot

/** Escala e deslocamento que levam o desenho, em unidades do viewBox, para pixels da tela. */
data class Encaixe(
    val escala: Float,
    val deslocamentoX: Float,
    val deslocamentoY: Float,
)

/**
 * Encaixa um desenho retangular numa tela redonda: a diagonal do desenho vira
 * o diametro do circulo (menos a folga), entao nenhum canto e cortado pela
 * borda, e o desenho fica centrado.
 */
fun encaixarNoCirculo(
    larguraDoDesenho: Float,
    alturaDoDesenho: Float,
    ladoDaTela: Float,
    folga: Float = 0.04f,
): Encaixe {
    val escala = ladoDaTela * (1 - folga) / hypot(larguraDoDesenho, alturaDoDesenho)
    return Encaixe(
        escala = escala,
        deslocamentoX = (ladoDaTela - larguraDoDesenho * escala) / 2,
        deslocamentoY = (ladoDaTela - alturaDoDesenho * escala) / 2,
    )
}
