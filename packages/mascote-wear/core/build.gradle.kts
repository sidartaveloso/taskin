plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.test {
    useJUnitPlatform()
    // As tabelas de casos compartilhadas com o TypeScript vivem fora deste
    // pacote; o teste recebe a raiz do repositorio em vez de adivinhar o
    // caminho relativo a partir do diretorio de trabalho do Gradle.
    systemProperty("taskin.repoRoot", rootProject.projectDir.resolve("../..").canonicalPath)
}
