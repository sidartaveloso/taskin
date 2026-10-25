package io.github.sidartaveloso.taskin.wear

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "w227dp-h227dp-round-watch")
class TelaInicialTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun `a tela inicial mostra o mascote, descrito como Taskin para o leitor de tela`() {
        compose.setContent { TelaInicial() }

        compose.onNodeWithContentDescription("Taskin").assertIsDisplayed()
    }
}
