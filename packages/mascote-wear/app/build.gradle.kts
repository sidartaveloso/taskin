plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "io.github.sidartaveloso.taskin.wear"
    // As bibliotecas do Compose para Wear OS (1.7) ja exigem compilar contra a
    // API 37; o alvo continua 36, a versao mais alta que o Watch6 recebeu.
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "io.github.sidartaveloso.taskin.wear"
        // Wear OS 4, a versao com que o Galaxy Watch6 saiu de fabrica.
        minSdk = 33
        targetSdk = 36
        versionCode = 1
        versionName = "0.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures {
        compose = true
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all {
                // O Robolectric mexe nos internos do FileDescriptor, que o JDK 21
                // so expoe a quem pede.
                it.jvmArgs("--add-exports", "java.base/jdk.internal.access=ALL-UNNAMED")
            }
        }
    }
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(project(":core"))

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.wear.compose.material3)
    implementation(libs.wear.compose.foundation)
    implementation(libs.activity.compose)

    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    testImplementation(libs.junit4)
    testImplementation(libs.robolectric)
    debugImplementation(libs.compose.ui.test.manifest)
}
