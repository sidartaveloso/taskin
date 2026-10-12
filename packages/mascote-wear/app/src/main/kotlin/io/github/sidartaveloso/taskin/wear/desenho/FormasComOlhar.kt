package io.github.sidartaveloso.taskin.wear.desenho

import io.github.sidartaveloso.taskin.wear.core.Olhar

/**
 * O quadro com as pupilas deslocadas para onde o mascote olha. Desloca so as
 * formas marcadas como pupila, no alcance do TaskinEyes do design-vue; o resto
 * volta como estava (a mesma instancia).
 */
fun formasComOlhar(
    quadro: List<Forma>,
    olhar: Olhar,
): List<Forma> {
    if (olhar == Olhar.CENTRO) return quadro
    val dx = olhar.x.coerceIn(-1f, 1f) * ALCANCE_DA_PUPILA
    val dy = olhar.y.coerceIn(-1f, 1f) * ALCANCE_DA_PUPILA
    return quadro.map { forma ->
        if (forma.papel == null) {
            forma
        } else {
            val m = forma.matriz.copyOf()
            m[4] += dx
            m[5] += dy
            forma.comMatriz(m)
        }
    }
}
