plugins {
    `java-library`
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.params)
    api(libs.kotlinx.serialization.json)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.test {
    useJUnitPlatform()
    // As tabelas de casos compartilhadas com o TypeScript vivem fora deste
    // pacote; o teste recebe a raiz do repositorio em vez de adivinhar o
    // caminho relativo a partir do diretorio de trabalho do Gradle.
    val raiz = rootProject.projectDir.resolve("../..").canonicalFile
    systemProperty("taskin.repoRoot", raiz.path)
    // Sem declarar as tabelas como entrada, o Gradle considera o teste em dia
    // depois de uma mudanca nelas e nem o roda — a divergencia passaria verde.
    inputs
        .files(
            fileTree(raiz) {
                include("packages/*/src/**/__fixtures__/*.cases.json")
                exclude("**/node_modules/**")
            },
        ).withPropertyName("tabelasCompartilhadas")
        .withPathSensitivity(PathSensitivity.RELATIVE)
}
