package io.github.sidartaveloso.taskin.wear.core

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.File

class TaskinWearTest {
    @Test
    fun `o nome exibido e Taskin`() {
        assertEquals("Taskin", TaskinWear.NOME)
    }

    @Test
    fun `o teste enxerga a raiz do repositorio, onde ficam as tabelas compartilhadas`() {
        val raiz = File(System.getProperty("taskin.repoRoot"))
        assertTrue(raiz.resolve("pnpm-workspace.yaml").isFile, "raiz recebida: $raiz")
    }
}
