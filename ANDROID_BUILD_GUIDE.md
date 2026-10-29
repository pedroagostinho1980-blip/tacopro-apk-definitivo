# 📱 Guia de Compilação do APK Definitivo TacoPro com Widget Nativo e Foreground Service

Este repositório contém agora toda a estrutura de código nativo do **TacoPro para Android** com:
- ✅ **Widget Nativo Real do Android (AppWidget):** Layout com os 4 símbolos oficiais (🚗 Condução, ⚒️ Trabalho, ⏹️ Disponibilidade, 🛏️ Repouso) e contador em tempo real no ecrã inicial do telemóvel/tablet.
- ✅ **Foreground Service com Notificação Permanente:** Impede o sistema operativo Android de suspender o tacógrafo.
- ✅ **Sobreposição Flutuante (`SYSTEM_ALERT_WINDOW`):** Bolha flutuante que permanece ativa por cima do Waze e Google Maps.

---

## 🛠️ Método 1: Compilar com o Android Studio no seu Computador (Recomendado)

1. Faça o download ou clone a pasta do projeto para o seu computador.
2. Abra o terminal na pasta do projeto e execute:
   ```bash
   npm install
   npm run build
   npx cap sync android
   ```
3. Abra o **Android Studio**:
   - Clique em **"Open"** e selecione a pasta `/android`.
   - Aguarde que o Gradle sincronize as dependências.
4. Para gerar o ficheiro **`.apk`**:
   - Vá ao menu superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - O Android Studio compila e gera o ficheiro:
     `android/app/build/outputs/apk/debug/app-debug.apk`
5. Transfira esse ficheiro para o seu telemóvel/tablet e instale diretamente!

---

## ☁️ Método 2: Compilar com GitHub Actions na Nuvem (Sem instalar Android Studio)

Pode criar um ficheiro `.github/workflows/build-apk.yml` no GitHub:
```yaml
name: Build Android APK
on: [push, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: TacoPro-Android-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
```
Ao enviar o código para o GitHub, o ficheiro `.apk` é compilado automaticamente e fica disponível para download na aba **Actions**!

---

## 🧩 Como adicionar o Widget depois de instalar o APK:
1. Pressione o fundo do ecrã do seu telemóvel Android.
2. Toque em **Widgets**.
3. Procure por **TacoPro**.
4. Arraste o widget **"TacoPro Tacógrafo (4 Símbolos)"** para o seu ecrã!
