package com.habita.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins must be registered before the bridge starts, otherwise
        // the web layer's first call lands on an unknown plugin.
        registerPlugin(CalendarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
