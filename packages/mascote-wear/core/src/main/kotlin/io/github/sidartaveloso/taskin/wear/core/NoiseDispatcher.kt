package io.github.sidartaveloso.taskin.wear.core

import kotlin.math.ceil
import kotlin.math.max

/*
 * Porte do `createNoiseDispatcher` de packages/ui-sense/src/utils/noise-watcher.ts.
 * O comportamento e o contrato da tabela packages/ui-sense/src/utils/__fixtures__/
 * noise-dispatcher.cases.json, que os dois lados percorrem: mudanca aqui sem
 * mudanca la (ou o contrario) e divergencia.
 *
 * Os tempos sao Double, em ms, como no TypeScript: a previsao de disparo divide
 * o intervalo medio entre amostras e nao e inteira.
 */

/** Intervalo minimo entre dois disparos, quando nao informado. */
const val DEFAULT_NOISE_DEBOUNCE_MS = 1500.0

/** Janela de sustentacao padrao: zero dispara na primeira amostra alta. */
const val DEFAULT_NOISE_SUSTAIN_MS = 0.0

/** Fracao padrao da janela que precisa estar acima do limiar. */
const val DEFAULT_NOISE_SUSTAIN_RATIO = 0.6

/**
 * Tempos de uma inscricao: `sustainMs` e quanto o barulho precisa se manter
 * alto ANTES do primeiro disparo; `debounceMs`, quanto precisa passar DEPOIS
 * dele ate o proximo.
 */
data class NoiseThresholdOptions(
    val debounceMs: Double = DEFAULT_NOISE_DEBOUNCE_MS,
    val sustainMs: Double = DEFAULT_NOISE_SUSTAIN_MS,
    val sustainRatio: Double = DEFAULT_NOISE_SUSTAIN_RATIO,
    val onProgress: ((NoiseProgress) -> Unit)? = null,
)

/** Estado do criterio no instante de uma amostra, para exibicao. */
data class NoiseProgress(
    val ratio: Double,
    val requiredRatio: Double,
    val msUntilWindowFull: Double,
    val msUntilDebounceOver: Double,
    /** Zero quando acabou de disparar; `null` quando ainda nao ha como estimar. */
    val msUntilFire: Double?,
)

class NoiseDispatcher {
    private class Amostra(val t: Double, val alta: Boolean)

    private class Ouvinte(
        val limiar: Double,
        val opcoes: NoiseThresholdOptions,
        val callback: () -> Unit,
    ) {
        // Comeca no passado distante para a primeira amostra alta disparar
        // seja qual for o instante em que o relogio comeca.
        var ultimoDisparo = Double.NEGATIVE_INFINITY
        val amostras = ArrayDeque<Amostra>()
        var primeiraAmostraEm: Double? = null
    }

    private val ouvintesDeNivel = LinkedHashSet<(Double) -> Unit>()
    private val ouvintes = LinkedHashSet<Ouvinte>()

    var currentLevel = 0.0
        private set

    fun onNoiseAbove(
        threshold: Double,
        options: NoiseThresholdOptions = NoiseThresholdOptions(),
        callback: () -> Unit,
    ): () -> Unit {
        val ouvinte = Ouvinte(threshold, options, callback)
        ouvintes += ouvinte
        return { ouvintes -= ouvinte }
    }

    fun subscribeLevel(callback: (Double) -> Unit): () -> Unit {
        ouvintesDeNivel += callback
        runCatching { callback(currentLevel) }
        return { ouvintesDeNivel -= callback }
    }

    fun dispatch(
        rms: Double,
        now: Double,
    ) {
        currentLevel = rms
        for (cb in ouvintesDeNivel.toList()) runCatching { cb(rms) }
        for (ouvinte in ouvintes.toList()) avaliar(ouvinte, rms, now)
    }

    private fun avaliar(
        l: Ouvinte,
        rms: Double,
        now: Double,
    ) {
        val o = l.opcoes
        val alta = rms >= l.limiar
        var disparouAgora = false

        fun faltaDoDebounce() = max(0.0, o.debounceMs - (now - l.ultimoDisparo))

        fun disparar() {
            // O debounce conta do disparo, nao do inicio do barulho.
            if (now - l.ultimoDisparo <= o.debounceMs) return
            l.ultimoDisparo = now
            disparouAgora = true
            runCatching { l.callback() }
        }

        // O estado e calculado depois da decisao: o debounce ja conta do disparo desta amostra.
        fun relatar(
            ratio: Double,
            msUntilWindowFull: Double,
            msUntilFire: Double?,
        ) {
            val onProgress = o.onProgress ?: return
            val debounce = faltaDoDebounce()
            runCatching {
                onProgress(
                    NoiseProgress(
                        ratio = ratio,
                        requiredRatio = o.sustainRatio,
                        msUntilWindowFull = msUntilWindowFull,
                        msUntilDebounceOver = debounce,
                        msUntilFire = if (disparouAgora) debounce else msUntilFire,
                    ),
                )
            }
        }

        if (o.sustainMs <= 0) {
            if (alta) disparar()
            relatar(if (alta) 1.0 else 0.0, 0.0, faltaDoDebounce())
            return
        }

        val primeira = l.primeiraAmostraEm ?: now.also { l.primeiraAmostraEm = it }
        l.amostras.addLast(Amostra(now, alta))
        val inicioDaJanela = now - o.sustainMs
        while (l.amostras.isNotEmpty() && l.amostras.first().t < inicioDaJanela) l.amostras.removeFirst()

        val altas = l.amostras.count { it.alta }
        val ratio = if (l.amostras.isNotEmpty()) altas.toDouble() / l.amostras.size else 0.0
        val msUntilWindowFull = max(0.0, o.sustainMs - (now - primeira))

        // Enquanto nao se observou uma janela inteira nao da para falar em
        // fracao: as primeiras amostras altas dariam 100% e disparariam na hora.
        if (msUntilWindowFull == 0.0 && ratio >= o.sustainRatio) disparar()

        if (o.onProgress == null) return

        // Sem duas amostras nao da nem para estimar o intervalo entre elas.
        val passo =
            if (l.amostras.size >= 2) (now - l.amostras.first().t) / (l.amostras.size - 1) else null

        val previsao =
            passo?.let {
                maxOf(
                    preverDisparoPorOcupacao(l.amostras, now, o.sustainMs, o.sustainRatio, it),
                    msUntilWindowFull,
                    faltaDoDebounce(),
                )
            }

        relatar(ratio, msUntilWindowFull, previsao)
    }

    /**
     * Quanto falta para a ocupacao da janela cruzar a fracao exigida, supondo
     * que toda amostra daqui para frente venha alta. Termina sempre: uma janela
     * inteira de barulho da ocupacao 1.
     */
    private fun preverDisparoPorOcupacao(
        amostras: ArrayDeque<Amostra>,
        agora: Double,
        janelaMs: Double,
        fracaoExigida: Double,
        passo: Double,
    ): Double {
        val simulacao = ArrayDeque(amostras)
        var t = agora
        val maximoDePassos = ceil(janelaMs / passo).toInt() + 1

        for (i in 0..maximoDePassos) {
            val altas = simulacao.count { it.alta }
            if (simulacao.isNotEmpty() && altas.toDouble() / simulacao.size >= fracaoExigida) return t - agora

            t += passo
            simulacao.addLast(Amostra(t, true))
            val inicio = t - janelaMs
            while (simulacao.isNotEmpty() && simulacao.first().t < inicio) simulacao.removeFirst()
        }

        return t - agora
    }
}
