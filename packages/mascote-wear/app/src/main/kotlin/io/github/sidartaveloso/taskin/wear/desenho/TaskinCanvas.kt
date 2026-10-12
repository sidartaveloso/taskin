package io.github.sidartaveloso.taskin.wear.desenho

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.geometry.Rect
import io.github.sidartaveloso.taskin.wear.core.Olhar
import io.github.sidartaveloso.taskin.wear.core.encaixarNoCirculo
import kotlin.math.min

/**
 * O Taskin novo desenhado na tela redonda, a partir das formas geradas do
 * componente do design-vue. Cabe inteiro no circulo inscrito e fica centrado.
 */
@Composable
fun TaskinCanvas(
    quadro: List<Forma>,
    modifier: Modifier = Modifier,
    olhar: Olhar = Olhar.CENTRO,
) {
    val formas = remember(quadro, olhar) { formasComOlhar(quadro, olhar) }
    val caminhos = remember(formas) { formas.map(::caminhoDe) }

    Canvas(modifier) {
        val lado = min(size.width, size.height)
        val caixa = CAIXA_DO_MASCOTE
        val encaixe = encaixarNoCirculo(caixa.width, caixa.height, lado)
        withTransform({
            translate((size.width - lado) / 2 + encaixe.deslocamentoX, (size.height - lado) / 2 + encaixe.deslocamentoY)
            scale(encaixe.escala, encaixe.escala, pivot = androidx.compose.ui.geometry.Offset.Zero)
            translate(-caixa.left, -caixa.top)
        }) {
            formas.forEachIndexed { i, forma -> desenhar(forma, caminhos[i]) }
        }
    }
}

/**
 * A area que o mascote ocupa, e nao o viewBox inteiro: o viewBox do Taskin tem
 * folga para baloes e efeitos, e encaixar por ele deixaria o mascote pequeno no
 * relogio. E a uniao dos dois quadros, para o tamanho nao pular entre eles, com
 * meia espessura de traco de margem.
 */
internal val CAIXA_DO_MASCOTE: Rect by lazy {
    (QUADRO_NEUTRO + QUADRO_SHHH)
        .map { forma ->
            val meioTraco = (forma.contorno?.espessura ?: 0f) / 2
            caminhoDe(forma).getBounds().inflate(meioTraco)
        }.reduce { a, b -> Rect(minOf(a.left, b.left), minOf(a.top, b.top), maxOf(a.right, b.right), maxOf(a.bottom, b.bottom)) }
}

private fun caminhoDe(forma: Forma): Path {
    val caminho =
        when (val g = forma.geometria) {
            is Geometria.Caminho -> PathParser().parsePathString(g.d).toPath()
            is Geometria.Elipse -> Path().apply { addOval(Rect(g.cx - g.rx, g.cy - g.ry, g.cx + g.rx, g.cy + g.ry)) }
        }
    caminho.transform(matrizCompose(forma.matriz))
    return caminho
}

/** A matriz afim do SVG na Matrix 4x4 do Compose. */
private fun matrizCompose(m: FloatArray): Matrix =
    Matrix().apply {
        this[0, 0] = m[0]
        this[0, 1] = m[1]
        this[1, 0] = m[2]
        this[1, 1] = m[3]
        this[3, 0] = m[4]
        this[3, 1] = m[5]
    }

private fun DrawScope.desenhar(
    forma: Forma,
    caminho: Path,
) {
    forma.preenchimento?.let { drawPath(caminho, Color(it.cor), alpha = forma.opacidade, style = Fill) }
    forma.contorno?.let { t ->
        // O caminho ja foi transformado; o traco escala pela area da matriz.
        val escala = kotlin.math.sqrt(kotlin.math.abs(forma.matriz[0] * forma.matriz[3] - forma.matriz[1] * forma.matriz[2]))
        drawPath(
            caminho,
            Color(t.cor),
            alpha = forma.opacidade,
            style =
                Stroke(
                    width = t.espessura * escala,
                    cap =
                        when (t.ponta) {
                            Ponta.BUTT -> StrokeCap.Butt
                            Ponta.ROUND -> StrokeCap.Round
                            Ponta.SQUARE -> StrokeCap.Square
                        },
                    join =
                        when (t.juncao) {
                            Juncao.MITER -> StrokeJoin.Miter
                            Juncao.ROUND -> StrokeJoin.Round
                            Juncao.BEVEL -> StrokeJoin.Bevel
                        },
                ),
        )
    }
}
