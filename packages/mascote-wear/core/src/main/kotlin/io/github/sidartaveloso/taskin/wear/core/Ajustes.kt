package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/*
 * Como o mascote guarda a configuracao no relogio — o mesmo que
 * packages/mascote/src/composables/ajustes.ts faz no celular.
 *
 * Nao ha `.taskin.json` no relogio, mas o formato e o mesmo: o que se grava e
 * o bloco `mascot` como se escreve no arquivo, e quem o le e a mesma
 * `resolveMascotNoiseSettings`. Guardar o objeto ja resolvido criaria uma
 * segunda definicao do que e uma reacao a ruido. E disso vem a propriedade
 * util: o que se ajusta no pulso pode ser colado no `.taskin.json`.
 */

/** Onde o texto do bloco fica guardado. O app liga isto ao armazenamento do aparelho. */
interface PortaDeArmazenamento {
    fun ler(): String?

    fun gravar(valor: String)
}

private val json = Json { prettyPrint = true }

/**
 * Le os ajustes gravados. Qualquer problema — nada gravado, JSON quebrado,
 * valor fora da faixa, armazenamento negado — cai nos padroes, que sao
 * conservadores: o mascote fica quieto ate ser ligado.
 */
fun lerAjustes(porta: PortaDeArmazenamento?): MascotNoiseSettings =
    runCatching {
        val bruto = porta?.ler()
        if (bruto.isNullOrEmpty()) null else resolveMascotNoiseSettings(Json.parseToJsonElement(bruto))
    }.getOrNull() ?: resolveMascotNoiseSettings(null)

/**
 * Grava o bloco, validando antes: o que nao passa pelo schema nao chega ao
 * armazenamento. Se o armazenamento falhar, os ajustes valem assim mesmo —
 * melhor que recusar a mudanca.
 *
 * @throws ConfiguracaoInvalida quando o bloco e invalido
 */
fun gravarAjustes(
    porta: PortaDeArmazenamento?,
    bloco: JsonObject,
): MascotNoiseSettings {
    val resolvido = resolveMascotNoiseSettings(bloco)
    runCatching { porta?.gravar(Json.encodeToString(JsonObject.serializer(), bloco)) }
    return resolvido
}

/** Monta o bloco no formato do arquivo a partir dos ajustes. */
fun blocoDe(ajustes: MascotNoiseSettings): JsonObject =
    buildJsonObject {
        put(
            "reactions",
            buildJsonObject {
                put(
                    "noise",
                    buildJsonObject {
                        put("enabled", ajustes.enabled)
                        put("threshold", ajustes.threshold)
                        put("debounceMs", ajustes.debounceMs)
                        put("sustainMs", ajustes.sustainMs)
                        put("sustainRatio", ajustes.sustainRatio)
                        put("sound", ajustes.sound)
                        put("name", JsonPrimitive(ajustes.name))
                        put("phrase", JsonPrimitive(ajustes.phrase))
                        put("volume", ajustes.volume)
                    },
                )
            },
        )
    }

/** O bloco como texto, pronto para colar na chave `mascot` de um `.taskin.json`. */
fun blocoComoTexto(bloco: JsonObject): String = json.encodeToString(JsonObject.serializer(), bloco)
