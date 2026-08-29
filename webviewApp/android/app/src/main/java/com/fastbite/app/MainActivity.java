package com.fastbite.app;

import android.content.Intent;
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.identity.SignInClient;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONObject;


public class MainActivity extends BridgeActivity {


  private final String HOME_URL =
      "https://mobileapp.fastbite.food/login";


  private static final int VOICE_REQUEST_CODE = 999;

  private static final int FILE_REQUEST_CODE = 200;
private static final int PHONE_HINT_REQUEST_CODE = 300;




  private ValueCallback<Uri[]> fileCallback;



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

    settings.setAllowFileAccess(true);

    settings.setAllowContentAccess(true);

    settings.setMediaPlaybackRequiresUserGesture(false);





    // =========================
    // WEBVIEW CLIENT
    // =========================


    webView.setWebChromeClient(new WebChromeClient() {



      // FILE UPLOAD

      @Override
      public boolean onShowFileChooser(

          WebView webView,

          ValueCallback<Uri[]> filePathCallback,

          FileChooserParams fileChooserParams

      ) {



        fileCallback = filePathCallback;



        Intent intent =
            fileChooserParams.createIntent();



        try {


          startActivityForResult(

              intent,

              FILE_REQUEST_CODE

          );


        } catch(Exception e) {


          fileCallback = null;


          return false;

        }



        return true;

      }





      // CAMERA / LOCATION PERMISSION


      @Override
      public void onPermissionRequest(

          final PermissionRequest request

      ) {


        runOnUiThread(() -> {


          request.grant(
              request.getResources()
          );


        });


      }





      @Override
      public void onGeolocationPermissionsShowPrompt(

          String origin,

          GeolocationPermissions.Callback callback

      ) {



        callback.invoke(

            origin,

            true,

            false

        );


      }


    });



// =========================
// PHONE NUMBER HINT BRIDGE
// =========================

webView.addJavascriptInterface(new Object(){

    @JavascriptInterface
    public void getPhoneNumber(){

        runOnUiThread(() -> {

          GetPhoneNumberHintIntentRequest request =
                    GetPhoneNumberHintIntentRequest.builder()
                    .build();


            Identity.getSignInClient(MainActivity.this)
            .getPhoneNumberHintIntent(request)
            .addOnSuccessListener(result -> {

                try {

                    startIntentSenderForResult(
                            result.getIntentSender(),
                            PHONE_HINT_REQUEST_CODE,
                            null,
                            0,
                            0,
                            0,
                            null
                    );

                } catch(Exception e){

                    e.printStackTrace();

                }

            })
            .addOnFailureListener(e -> {

                e.printStackTrace();

            });


        });

    }


},"PhoneHint");




    // =========================
    // VOICE BRIDGE
    // =========================


    webView.addJavascriptInterface(new Object(){



      @JavascriptInterface

      public void startVoiceSearch(){


        runOnUiThread(() -> {



          Intent intent =
              new Intent(
                  RecognizerIntent.ACTION_RECOGNIZE_SPEECH
              );



          intent.putExtra(

              RecognizerIntent.EXTRA_LANGUAGE_MODEL,

              RecognizerIntent.LANGUAGE_MODEL_FREE_FORM

          );



       intent.putExtra(
    RecognizerIntent.EXTRA_LANGUAGE,
    new Locale("hi","IN")
);



          intent.putExtra(

              RecognizerIntent.EXTRA_PROMPT,

              "Speak now..."

          );




          try {


            startActivityForResult(

                intent,

                VOICE_REQUEST_CODE

            );


          }catch(Exception e){


            e.printStackTrace();

          }



        });


      }



    },"AndroidVoice");






    // =========================
    // BACK BUTTON
    // =========================



    getOnBackPressedDispatcher()

        .addCallback(

        this,

        new OnBackPressedCallback(true) {



          @Override

          public void handleOnBackPressed(){



            String url = webView.getUrl();




            if(url != null && url.equals(HOME_URL)){


              finish();


            }

            else if(webView.canGoBack()){


              webView.goBack();


            }

            else{


              finish();

            }



          }


        });





  }






  // =========================
  // RESULT HANDLER
  // =========================



  private void dispatchPhoneNumberHint(String phoneNumber) {
    if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
      return;
    }

    String escapedPhoneNumber = JSONObject.quote(phoneNumber);
    String js =
        "window.dispatchEvent(new CustomEvent('PHONE_NUMBER', { detail: " + escapedPhoneNumber + " }));"
            + "window.dispatchEvent(new CustomEvent('phoneNumberHint', { detail: " + escapedPhoneNumber + " }));"
            + "if (typeof window.onPhoneNumberHint === 'function') { window.onPhoneNumberHint(" + escapedPhoneNumber + "); }"
            + "window.postMessage({ type: 'PHONE_NUMBER', phoneNumber: " + escapedPhoneNumber + " }, '*');";

    webView.evaluateJavascript(js, null);
  }

  @Override

  protected void onActivityResult(

      int requestCode,

      int resultCode,

      Intent data

  ){



    super.onActivityResult(

        requestCode,

        resultCode,

        data

    );






    // FILE RESULT


    if(requestCode == FILE_REQUEST_CODE){



      Uri[] result = null;



      if(resultCode == RESULT_OK && data != null){



        Uri uri = data.getData();



        if(uri != null){


          result = new Uri[]{uri};


        }


      }




      if(fileCallback != null){



        fileCallback.onReceiveValue(result);



        fileCallback = null;



      }



      return;


    }



// =========================
// PHONE NUMBER RESULT
// =========================
if (requestCode == PHONE_HINT_REQUEST_CODE && resultCode == RESULT_OK) {

    try {

        SignInClient signInClient = Identity.getSignInClient(this);

        String phoneNumber = signInClient.getPhoneNumberFromIntent(data);

        if (phoneNumber != null) {
            dispatchPhoneNumberHint(phoneNumber);
        }

    } catch (Exception e) {
        e.printStackTrace();
    }

    return;
}



    // VOICE RESULT
 if(
    requestCode == VOICE_REQUEST_CODE
    && resultCode == RESULT_OK
    && data != null
){

    ArrayList<String> result =
        data.getStringArrayListExtra(
            RecognizerIntent.EXTRA_RESULTS
        );


    if(result != null && !result.isEmpty()){


        String text = result.get(0);

String js =
    "window.dispatchEvent(" +
    "new CustomEvent('VOICE_TEXT'," +
    "{detail:" + JSONObject.quote(text) + "})" +
    ")";


        webView.evaluateJavascript(
            js,
            null
        );

    }

}



  }



}