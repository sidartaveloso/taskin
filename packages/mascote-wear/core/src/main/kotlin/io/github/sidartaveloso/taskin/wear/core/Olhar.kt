package io.github.sidartaveloso.taskin.wear.core

/**
 * Para onde o mascote olha, normalizado: -1..1 nos dois eixos, com x para a
 * direita e y para baixo, como na tela. Quem produz o olhar (o acelerometro, na
 * task-180) nao precisa saber o quanto a pupila anda: isso e do desenho.
 */
data class Olhar(
    val x: Float,
    val y: Float,
) {
    companion object {
        val CENTRO = Olhar(0f, 0f)
    }
}
