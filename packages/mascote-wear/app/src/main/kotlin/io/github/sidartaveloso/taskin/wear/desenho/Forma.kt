package io.github.sidartaveloso.taskin.wear.desenho

/*
 * O modelo do desenho gerado em DesenhoGerado.kt. Cada forma ja traz a
 * transformacao acumulada dos grupos do SVG e as cores herdadas, entao
 * desenhar e so percorrer a lista.
 */

sealed interface Geometria {
    /** O atributo `d` de um `<path>`. */
    data class Caminho(
        val d: String,
    ) : Geometria

    data class Elipse(
        val cx: Float,
        val cy: Float,
        val rx: Float,
        val ry: Float,
    ) : Geometria
}

/** Cor em `0xAARRGGBB`. */
data class Tinta(
    val cor: Long,
)

enum class Ponta { BUTT, ROUND, SQUARE }

enum class Juncao { MITER, ROUND, BEVEL }

data class Traco(
    val cor: Long,
    val espessura: Float,
    val ponta: Ponta,
    val juncao: Juncao,
)

enum class Papel { PUPILA_ESQUERDA, PUPILA_DIREITA }

class Forma(
    val geometria: Geometria,
    val preenchimento: Tinta?,
    val contorno: Traco?,
    val opacidade: Float,
    /** `[a, b, c, d, e, f]` do SVG: x' = a·x + c·y + e, y' = b·x + d·y + f. */
    val matriz: FloatArray,
    val papel: Papel?,
) {
    fun comMatriz(nova: FloatArray) = Forma(geometria, preenchimento, contorno, opacidade, nova, papel)

    override fun equals(other: Any?): Boolean =
        other is Forma &&
            geometria == other.geometria &&
            preenchimento == other.preenchimento &&
            contorno == other.contorno &&
            opacidade == other.opacidade &&
            matriz.contentEquals(other.matriz) &&
            papel == other.papel

    override fun hashCode(): Int = geometria.hashCode() * 31 + matriz.contentHashCode()
}
