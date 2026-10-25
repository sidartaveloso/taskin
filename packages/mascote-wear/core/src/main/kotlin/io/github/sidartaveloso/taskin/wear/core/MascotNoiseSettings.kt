package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlin.math.floor

/*
 * Porte de `MascotNoiseReactionConfigSchema` e `resolveMascotNoiseSettings`
 * (packages/types-ts/src/taskin.schemas.ts). O contrato e a tabela
 * packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json.
 *
 * O schema TypeScript e um zod; aqui a validacao e escrita a mao, campo a
 * campo, com as mesmas regras: ausente vale o padrao, presente precisa ter o
 * tipo e a faixa certos (null nao e ausente), chaves desconhecidas sao
 * ignoradas, nome e frase perdem os espacos das pontas.
 */

/** Os ajustes da reacao a ruido, com os padroes aplicados. */
data class MascotNoiseSettings(
    val enabled: Boolean,
    val threshold: Double,
    val debounceMs: Long,
    val sound: Boolean,
    val sustainMs: Long,
    val sustainRatio: Double,
    val name: String,
    val phrase: String,
    val volume: Double,
)

/** O bloco `mascot` nao passa pelo schema. A mensagem diz onde. */
class ConfiguracaoInvalida(
    mensagem: String,
) : IllegalArgumentException(mensagem)

/**
 * Le o bloco `mascot` como se escreve no `.taskin.json` — ausente, parcial ou
 * completo — e devolve os ajustes com os padroes aplicados.
 *
 * @throws ConfiguracaoInvalida quando o bloco viola o schema
 */
fun resolveMascotNoiseSettings(mascot: JsonElement?): MascotNoiseSettings {
    val raiz = if (mascot == null || mascot is JsonNull) JsonObject(emptyMap()) else objeto(mascot, "mascot")
    val reactions = raiz["reactions"]?.let { objeto(it, "mascot.reactions") } ?: JsonObject(emptyMap())
    val noise = reactions["noise"]?.let { objeto(it, "mascot.reactions.noise") } ?: JsonObject(emptyMap())
    val campo = Campos(noise, "mascot.reactions.noise")

    return MascotNoiseSettings(
        enabled = campo.booleano("enabled", padrao = false),
        threshold = campo.numero("threshold", padrao = 0.06, minimo = 0.0, maximo = 1.0),
        debounceMs = campo.inteiroNaoNegativo("debounceMs", padrao = 1500),
        sustainMs = campo.inteiroNaoNegativo("sustainMs", padrao = 0),
        sustainRatio = campo.numero("sustainRatio", padrao = 0.6, minimo = 0.0, maximo = 1.0),
        sound = campo.booleano("sound", padrao = false),
        name = campo.texto("name", padrao = "", minimo = 0),
        phrase = campo.texto("phrase", padrao = "Shhhhhh...", minimo = 1),
        volume = campo.numero("volume", padrao = 1.0, minimo = 0.0, maximo = 1.0),
    )
}

private fun objeto(
    elemento: JsonElement,
    onde: String,
): JsonObject = elemento as? JsonObject ?: throw ConfiguracaoInvalida("$onde precisa ser um objeto")

private class Campos(
    private val obj: JsonObject,
    private val onde: String,
) {
    private fun primitivo(nome: String): JsonPrimitive? {
        val valor = obj[nome] ?: return null
        return valor as? JsonPrimitive
            ?: throw ConfiguracaoInvalida("$onde.$nome tem o tipo errado")
    }

    fun booleano(
        nome: String,
        padrao: Boolean,
    ): Boolean {
        val p = primitivo(nome) ?: return padrao
        if (p.isString || p is JsonNull) throw ConfiguracaoInvalida("$onde.$nome precisa ser booleano")
        return p.booleanOrNull ?: throw ConfiguracaoInvalida("$onde.$nome precisa ser booleano")
    }

    fun numero(
        nome: String,
        padrao: Double,
        minimo: Double,
        maximo: Double,
    ): Double {
        val p = primitivo(nome) ?: return padrao
        val d = numeroDe(p, nome)
        if (d < minimo || d > maximo) throw ConfiguracaoInvalida("$onde.$nome precisa estar entre $minimo e $maximo")
        return d
    }

    fun inteiroNaoNegativo(
        nome: String,
        padrao: Long,
    ): Long {
        val p = primitivo(nome) ?: return padrao
        val d = numeroDe(p, nome)
        if (d != floor(d)) throw ConfiguracaoInvalida("$onde.$nome precisa ser inteiro")
        if (d < 0) throw ConfiguracaoInvalida("$onde.$nome nao pode ser negativo")
        return d.toLong()
    }

    fun texto(
        nome: String,
        padrao: String,
        minimo: Int,
    ): String {
        val p = primitivo(nome) ?: return padrao
        if (!p.isString) throw ConfiguracaoInvalida("$onde.$nome precisa ser texto")
        val aparado = p.content.trim()
        if (aparado.length < minimo) throw ConfiguracaoInvalida("$onde.$nome nao pode ficar vazio")
        return aparado
    }

    private fun numeroDe(
        p: JsonPrimitive,
        nome: String,
    ): Double {
        if (p.isString || p is JsonNull) throw ConfiguracaoInvalida("$onde.$nome precisa ser numero")
        val d = p.doubleOrNull ?: throw ConfiguracaoInvalida("$onde.$nome precisa ser numero")
        if (!d.isFinite()) throw ConfiguracaoInvalida("$onde.$nome precisa ser numero")
        return d
    }
}
