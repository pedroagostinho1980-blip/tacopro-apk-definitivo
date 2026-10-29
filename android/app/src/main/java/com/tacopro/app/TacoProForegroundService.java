package com.tacopro.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;

/**
 * Native Android Foreground Service for TacoPro
 * Guarantees that continuous driving time, shift amplitude, and rest
 * are never halted by Android OS memory cleaner or battery optimizations.
 */
public class TacoProForegroundService extends Service {

    public static final String CHANNEL_ID = "tacopro_tachograph_service_channel";
    private static final int NOTIFICATION_ID = 9001;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int elapsedSeconds = 0;
    private String currentActivity = "AVAILABILITY";

    private final Runnable timerRunnable = new Runnable() {
        @Override
        public void run() {
            elapsedSeconds++;
            updateNotification();
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        SharedPreferences prefs = getSharedPreferences("TacoProWidgetPrefs", Context.MODE_PRIVATE);
        currentActivity = prefs.getString("current_activity", "AVAILABILITY");
        startForeground(NOTIFICATION_ID, buildNotification());
        handler.post(timerRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.hasExtra("activity")) {
            currentActivity = intent.getStringExtra("activity");
            elapsedSeconds = 0;
            updateNotification();
        }
        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "TacoPro - Serviço Contínuo de Tacógrafo",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Mantém a monitorização em tempo real de tempos de condução e repouso (Reg. CE 561/2006)");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        int hours = elapsedSeconds / 3600;
        int minutes = (elapsedSeconds % 3600) / 60;
        int seconds = elapsedSeconds % 60;
        String timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds);

        String title = "TacoPro: " + currentActivity;
        if ("DRIVING".equals(currentActivity)) title = "🚗 Condução em Curso";
        else if ("WORK".equals(currentActivity)) title = "⚒️ Outro Trabalho";
        else if ("REST".equals(currentActivity)) title = "🛏️ Repouso / Pausa";
        else if ("AVAILABILITY".equals(currentActivity)) title = "⏹️ Disponibilidade";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText("Duração atual: " + timeStr + " · Reg. CE 561/2006")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(timerRunnable);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
