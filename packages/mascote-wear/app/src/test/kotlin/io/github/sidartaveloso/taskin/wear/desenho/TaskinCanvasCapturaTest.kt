package io.github.sidartaveloso.taskin.wear.desenho

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.github.takahirom.roborazzi.captureRoboImage
import io.github.sidartaveloso.taskin.wear.core.Olhar
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Capturas do mascote nas telas do Galaxy Watch6 (40 mm: 432 px; 44 mm: 480 px)
 * e na do emulador (454 px), todas a 2x. As imagens ficam em
 * `src/test/snapshots/` e sao a referencia do `verifyRoborazziDebug`.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TaskinCanvasCapturaTest {
    @get:Rule
    val compose = createComposeRule()

    private fun capturar(
        nome: String,
        quadro: List<Forma>,
        olhar: Olhar = Olhar.CENTRO,
    ) {
        compose.setContent {
            Box(Modifier.fillMaxSize().background(Color.Black)) {
                TaskinCanvas(quadro = quadro, olhar = olhar, modifier = Modifier.fillMaxSize())
            }
        }
        compose.onRoot().captureRoboImage("src/test/snapshots/$nome.png")
    }

    @Test
    @Config(qualifiers = "w216dp-h216dp-round-watch-xhdpi")
    fun neutro432() = capturar("neutro-432", QUADRO_NEUTRO)

    @Test
    @Config(qualifiers = "w227dp-h227dp-round-watch-xhdpi")
    fun neutro454() = capturar("neutro-454", QUADRO_NEUTRO)

    @Test
    @Config(qualifiers = "w240dp-h240dp-round-watch-xhdpi")
    fun neutro480() = capturar("neutro-480", QUADRO_NEUTRO)

    @Test
    @Config(qualifiers = "w227dp-h227dp-round-watch-xhdpi")
    fun shhh454() = capturar("shhh-454", QUADRO_SHHH)

    @Test
    @Config(qualifiers = "w227dp-h227dp-round-watch-xhdpi")
    fun olhandoParaBaixoEADireita454() = capturar("olhar-baixo-direita-454", QUADRO_NEUTRO, Olhar(x = 1f, y = 1f))
}
