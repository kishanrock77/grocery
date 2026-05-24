package com.webview.app;

import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends BridgeActivity {

  private final String HOME_URL =
    "https://mobileapp.fastbite.food/home";

  private static final int VOICE_REQUEST_CODE = 999;

  WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {

    super.onCreate(savedInstanceState);

    webView = getBridge().getWebView();

    // =========================
    // WEB SETTINGS
    // =========================
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setGeolocationEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);

    // =========================
    // WEB PERMISSIONS
    // =========================
    webView.setWebChromeClient(new WebChromeClient() {

      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }

      @Override
      public void onGeolocationPermissionsShowPrompt(
        String origin,
        GeolocationPermissions.Callback callback
      ) {
        callback.invoke(origin, true, false);
      }
    });

    // =========================
    // JS BRIDGE (START VOICE)
    // =========================
    webView.addJavascriptInterface(new Object() {

      @JavascriptInterface
      public void startVoiceSearch() {

        runOnUiThread(() -> {

          Intent intent = new Intent(
            RecognizerIntent.ACTION_RECOGNIZE_SPEECH
          );

          // 🔥 FORCE ENGLISH
          intent.putExtra(
            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
          );

          intent.putExtra(
            RecognizerIntent.EXTRA_LANGUAGE,
            Locale.ENGLISH
          );

          intent.putExtra(
            RecognizerIntent.EXTRA_PROMPT,
            "Speak now..."
          );

          try {
            startActivityForResult(intent, VOICE_REQUEST_CODE);
          } catch (Exception e) {
            e.printStackTrace();
          }

        });

      }

    }, "AndroidVoice");

    // =========================
    // BACK HANDLER
    // =========================
    getOnBackPressedDispatcher().addCallback(
      this,
      new OnBackPressedCallback(true) {

        @Override
        public void handleOnBackPressed() {

          String currentUrl = webView.getUrl();

          if (currentUrl != null && currentUrl.equals(HOME_URL)) {
            finish();
          } else if (webView.canGoBack()) {
            webView.goBack();
          } else {
            finish();
          }
        }
      });
  }

  // =========================
  // VOICE RESULT HANDLER
  // =========================
  @Override
  protected void onActivityResult(
    int requestCode,
    int resultCode,
    Intent data
  ) {

    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode == VOICE_REQUEST_CODE && resultCode == RESULT_OK && data != null) {

      ArrayList<String> result =
        data.getStringArrayListExtra(
          RecognizerIntent.EXTRA_RESULTS
        );

      if (result != null && !result.isEmpty()) {

        String text = result.get(0);

        // escape safe
        text = text.replace("'", "\\'");

        webView.evaluateJavascript(
          "window.dispatchEvent(new CustomEvent('VOICE_TEXT', { detail: '" + text + "' }))",
          null
        );
      }
    }
  }
}
