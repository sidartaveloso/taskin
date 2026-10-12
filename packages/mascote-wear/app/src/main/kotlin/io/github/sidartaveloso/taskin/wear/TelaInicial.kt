package io.github.sidartaveloso.taskin.wear

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import io.github.sidartaveloso.taskin.wear.core.TaskinWear
import io.github.sidartaveloso.taskin.wear.desenho.QUADRO_NEUTRO
import io.github.sidartaveloso.taskin.wear.desenho.TaskinCanvas

@Composable
fun TelaInicial() {
    MaterialTheme {
        AppScaffold {
            ScreenScaffold {
                TaskinCanvas(
                    quadro = QUADRO_NEUTRO,
                    modifier = Modifier.fillMaxSize().semantics { contentDescription = TaskinWear.NOME },
                )
            }
        }
    }
}

@Preview(device = "id:wearos_large_round", showSystemUi = true)
@Composable
private fun TelaInicialPreview() {
    TelaInicial()
}
