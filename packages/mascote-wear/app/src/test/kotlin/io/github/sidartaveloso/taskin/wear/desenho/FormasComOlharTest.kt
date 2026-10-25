package io.github.sidartaveloso.taskin.wear.desenho

import io.github.sidartaveloso.taskin.wear.core.Olhar
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test

class FormasComOlharTest {
    private fun pupilas(formas: List<Forma>) = formas.filter { it.papel != null }

    @Test
    fun `olhando para o centro, nada muda`() {
        assertEquals(QUADRO_NEUTRO, formasComOlhar(QUADRO_NEUTRO, Olhar.CENTRO))
    }

    @Test
    fun `o olhar desloca as duas pupilas pelo alcance do TaskinEyes, e so elas`() {
        val olhando = formasComOlhar(QUADRO_NEUTRO, Olhar(x = 1f, y = -0.5f))

        QUADRO_NEUTRO.zip(olhando).forEach { (antes, depois) ->
            if (antes.papel == null) {
                assertSame(antes, depois)
            } else {
                assertEquals(antes.matriz[4] + ALCANCE_DA_PUPILA, depois.matriz[4], 1e-4f)
                assertEquals(antes.matriz[5] - ALCANCE_DA_PUPILA / 2, depois.matriz[5], 1e-4f)
            }
        }
        assertEquals(2, pupilas(olhando).size)
    }

    @Test
    fun `os dois quadros do shhh tem as duas pupilas`() {
        assertEquals(2, pupilas(QUADRO_NEUTRO).size)
        assertEquals(2, pupilas(QUADRO_SHHH).size)
    }
}
