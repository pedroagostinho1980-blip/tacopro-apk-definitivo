package com.tacopro.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * Native Android Main Activity for TacoPro
 * Integrates Capacitor with Android system services and handles bidirectional
 * communication between the WebView (React) and the Android Home Screen Widget.
 */
public class MainActivity extends BridgeActivity {

    public static final String ACTION_WIDGET_ACTIVITY_CHANGED = "com.tacopro.app.WIDGET_ACTIVITY_CHANGED";

    private final BroadcastReceiver widgetReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && ACTION_WIDGET_ACTIVITY_CHANGED.equals(intent.getAction())) {
                String activity = intent.getStringExtra("activity");
                notifyWebActivityChanged(activity);
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Start Tachograph Foreground Service on app launch
        Intent serviceIntent = new Intent(this, TacoProForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        // Register receiver for real-time widget activity changes
        IntentFilter filter = new IntentFilter(ACTION_WIDGET_ACTIVITY_CHANGED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(widgetReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(widgetReceiver, filter);
        }

        // Expose native JavaScript bridge to WebView
        setupJavaScriptBridge();
    }

    private void setupJavaScriptBridge() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new TacoProNativeBridge(this), "TacoProNative");
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Check if widget changed activity while app was paused
        SharedPreferences prefs = getSharedPreferences(TacoProAppWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        String currentActivity = prefs.getString(TacoProAppWidgetProvider.KEY_CURRENT_ACTIVITY, null);
        if (currentActivity != null) {
            notifyWebActivityChanged(currentActivity);
        }
    }

    public void notifyWebActivityChanged(final String activity) {
        if (activity == null || getBridge() == null || getBridge().getWebView() == null) return;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    WebView webView = getBridge().getWebView();
                    String js = "window.dispatchEvent(new CustomEvent('tacopro_native_activity_changed', { detail: { activity: '" + activity + "' } }));";
                    webView.evaluateJavascript(js, null);
                } catch (Exception ignored) {}
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(widgetReceiver);
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    /**
     * JavaScript Bridge interface callable from React window.TacoProNative
     */
    public static class TacoProNativeBridge {
        private final Context context;

        public TacoProNativeBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void updateWidgetState(String activity, long startTimestamp, long continuousDriveMins) {
            Intent updateIntent = new Intent(context, TacoProAppWidgetProvider.class);
            updateIntent.setAction(TacoProAppWidgetProvider.ACTION_UPDATE_FROM_WEB);
            updateIntent.putExtra("activity", activity);
            updateIntent.putExtra("startTimestamp", startTimestamp);
            updateIntent.putExtra("continuousDriveMins", continuousDriveMins);
            context.sendBroadcast(updateIntent);
        }

        @JavascriptInterface
        public String getWidgetCurrentActivity() {
            SharedPreferences prefs = context.getSharedPreferences(TacoProAppWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getString(TacoProAppWidgetProvider.KEY_CURRENT_ACTIVITY, "AVAILABILITY");
        }
    }
}
