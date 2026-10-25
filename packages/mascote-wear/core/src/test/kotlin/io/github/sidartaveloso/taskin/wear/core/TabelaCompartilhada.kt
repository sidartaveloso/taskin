package io.github.sidartaveloso.taskin.wear.core

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import java.io.File

/**
 * Le uma das tabelas de casos que o TypeScript tambem percorre. O caminho vem
 * da raiz do repositorio, que o Gradle passa ao teste: as tabelas sao do
 * pacote TypeScript, e nao deste.
 */
object TabelaCompartilhada {
    private val raiz: File by lazy {
        File(requireNotNull(System.getProperty("taskin.repoRoot")) { "o Gradle nao passou taskin.repoRoot" })
    }

    fun casos(caminhoNoRepositorio: String): List<JsonObject> {
        val arquivo = raiz.resolve(caminhoNoRepositorio)
        check(arquivo.isFile) { "tabela nao encontrada: $arquivo" }
        val casos = Json.parseToJsonElement(arquivo.readText()).jsonObject.getValue("cases").jsonArray
        return casos.map { it.jsonObject }
    }
}

fun JsonElement?.isNullish(): Boolean = this == null || this is JsonNull

fun JsonElement.asDouble(): Double = (this as JsonPrimitive).double

fun JsonElement.asDoubleList(): List<Double> = (this as JsonArray).map { it.asDouble() }

fun JsonElement.asBoolean(): Boolean = requireNotNull((this as JsonPrimitive).booleanOrNull)
