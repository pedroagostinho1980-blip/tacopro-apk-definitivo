package com.tacopro.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.RemoteViews;

/**
 * Native Android Home Screen Widget Provider for TacoPro
 * Provides 1-tap switching between the 4 Tachograph activities:
 * 🚗 DRIVING, ⚒️ WORK, ⏹️ AVAILABILITY, 🛏️ REST
 * Uses Android native Chronometer for live continuous time counting.
 */
public class TacoProAppWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_SWITCH_DRIVING = "com.tacopro.app.ACTION_SWITCH_DRIVING";
    public static final String ACTION_SWITCH_WORK = "com.tacopro.app.ACTION_SWITCH_WORK";
    public static final String ACTION_SWITCH_AVAILABILITY = "com.tacopro.app.ACTION_SWITCH_AVAILABILITY";
    public static final String ACTION_SWITCH_REST = "com.tacopro.app.ACTION_SWITCH_REST";
    public static final String ACTION_UPDATE_FROM_WEB = "com.tacopro.app.ACTION_UPDATE_FROM_WEB";

    public static final String PREFS_NAME = "TacoProWidgetPrefs";
    public static final String KEY_CURRENT_ACTIVITY = "current_activity";
    public static final String KEY_START_TIMESTAMP = "start_timestamp";
    public static final String KEY_CONTINUOUS_DRIVE_MINUTES = "continuous_drive_minutes";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, TacoProAppWidgetProvider.class);
        int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
        for (int widgetId : allWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String currentActivity = prefs.getString(KEY_CURRENT_ACTIVITY, "AVAILABILITY");
        long startTimestamp = prefs.getLong(KEY_START_TIMESTAMP, System.currentTimeMillis());
        long continuousDriveMins = prefs.getLong(KEY_CONTINUOUS_DRIVE_MINUTES, 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.tacopro_widget_layout);

        // Update Labels based on current activity
        String label = "DISPONIBILIDADE";
        if ("DRIVING".equals(currentActivity)) {
            label = "CONDUÇÃO 🚗";
            views.setTextColor(R.id.widget_status_label, 0xFF10B981);
        } else if ("WORK".equals(currentActivity)) {
            label = "TRABALHO ⚒️";
            views.setTextColor(R.id.widget_status_label, 0xFFF59E0B);
        } else if ("REST".equals(currentActivity)) {
            label = "REPOUSO / PAUSA 🛏️";
            views.setTextColor(R.id.widget_status_label, 0xFF818CF8);
        } else {
            label = "DISPONIBILIDADE ⏹️";
            views.setTextColor(R.id.widget_status_label, 0xFF22D3EE);
        }
        views.setTextViewText(R.id.widget_status_label, label);

        // Native Chronometer: starts counting immediately and live on home screen
        long now = System.currentTimeMillis();
        long elapsedMillis = Math.max(0, now - startTimestamp);
        long baseTime = SystemClock.elapsedRealtime() - elapsedMillis;
        views.setChronometer(R.id.widget_chronometer, baseTime, "%s", true);

        // Context info (Continuous Driving 4h30)
        long remainingMins = Math.max(0, 270 - continuousDriveMins);
        long remHours = remainingMins / 60;
        long remMinutes = remainingMins % 60;
        String remainingStr = String.format("%02dh %02dm", remHours, remMinutes);
        views.setTextViewText(R.id.widget_context_value, remainingStr);
        if (remainingMins <= 30) {
            views.setTextColor(R.id.widget_context_value, 0xFFEF4444); // Red
        } else if (remainingMins <= 60) {
            views.setTextColor(R.id.widget_context_value, 0xFFF59E0B); // Amber
        } else {
            views.setTextColor(R.id.widget_context_value, 0xFF10B981); // Emerald
        }

        // 1. PendingIntent for DRIVING (🚗)
        Intent driveIntent = new Intent(context, TacoProAppWidgetProvider.class);
        driveIntent.setAction(ACTION_SWITCH_DRIVING);
        PendingIntent drivePending = PendingIntent.getBroadcast(
                context, 101, driveIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_drive, drivePending);

        // 2. PendingIntent for WORK (⚒️)
        Intent workIntent = new Intent(context, TacoProAppWidgetProvider.class);
        workIntent.setAction(ACTION_SWITCH_WORK);
        PendingIntent workPending = PendingIntent.getBroadcast(
                context, 102, workIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_work, workPending);

        // 3. PendingIntent for AVAILABILITY (⏹️)
        Intent availIntent = new Intent(context, TacoProAppWidgetProvider.class);
        availIntent.setAction(ACTION_SWITCH_AVAILABILITY);
        PendingIntent availPending = PendingIntent.getBroadcast(
                context, 103, availIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_avail, availPending);

        // 4. PendingIntent for REST (🛏️)
        Intent restIntent = new Intent(context, TacoProAppWidgetProvider.class);
        restIntent.setAction(ACTION_SWITCH_REST);
        PendingIntent restPending = PendingIntent.getBroadcast(
                context, 104, restIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_rest, restPending);

        // Tap on Header opens the full App
        Intent openAppIntent = new Intent(context, MainActivity.class);
        PendingIntent openAppPending = PendingIntent.getActivity(
                context, 100, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_app_title, openAppPending);
        views.setOnClickPendingIntent(R.id.widget_status_label, openAppPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (action == null) return;

        if (ACTION_UPDATE_FROM_WEB.equals(action)) {
            // Update widget with data sent from JavaScript
            String activity = intent.getStringExtra("activity");
            long startTimestamp = intent.getLongExtra("startTimestamp", System.currentTimeMillis());
            long continuousDriveMins = intent.getLongExtra("continuousDriveMins", 0);

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            if (activity != null) editor.putString(KEY_CURRENT_ACTIVITY, activity);
            if (startTimestamp > 0) editor.putLong(KEY_START_TIMESTAMP, startTimestamp);
            editor.putLong(KEY_CONTINUOUS_DRIVE_MINUTES, continuousDriveMins);
            editor.apply();

            updateAllWidgets(context);
            return;
        }

        String newActivity = null;
        if (ACTION_SWITCH_DRIVING.equals(action)) {
            newActivity = "DRIVING";
        } else if (ACTION_SWITCH_WORK.equals(action)) {
            newActivity = "WORK";
        } else if (ACTION_SWITCH_AVAILABILITY.equals(action)) {
            newActivity = "AVAILABILITY";
        } else if (ACTION_SWITCH_REST.equals(action)) {
            newActivity = "REST";
        }

        if (newActivity != null) {
            // Haptic vibration feedback
            try {
                Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(50);
                    }
                }
            } catch (Exception ignored) {}

            // Save state & reset live timestamp
            long now = System.currentTimeMillis();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString(KEY_CURRENT_ACTIVITY, newActivity)
                .putLong(KEY_START_TIMESTAMP, now)
                .apply();

            // Refresh all widgets immediately with live Chronometer
            updateAllWidgets(context);

            // Sync with Foreground Service
            Intent serviceIntent = new Intent(context, TacoProForegroundService.class);
            serviceIntent.setAction("SYNC_ACTIVITY");
            serviceIntent.putExtra("activity", newActivity);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Send broadcast to MainActivity so the web app updates in real-time
            Intent appBroadcast = new Intent(MainActivity.ACTION_WIDGET_ACTIVITY_CHANGED);
            appBroadcast.putExtra("activity", newActivity);
            appBroadcast.putExtra("timestamp", now);
            context.sendBroadcast(appBroadcast);
        }
    }
}
