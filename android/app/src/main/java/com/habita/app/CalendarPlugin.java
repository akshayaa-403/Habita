package com.habita.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.TimeZone;

/**
 * Reads and writes the phone's own calendar through {@link CalendarContract}.
 *
 * Habita blocks out time for tasks in whatever calendar the user already uses,
 * rather than keeping a private schedule the rest of their phone cannot see. So
 * every scheduled task owns a real calendar event: created when the task is
 * dropped onto the timeline, updated when it is dragged or resized, deleted when
 * the task is unscheduled or removed.
 *
 * This is a local plugin (not an npm dependency) because the surface needed is
 * small and specific: one calendar picked as the target, events in a time range,
 * and per-event colours matching the Eisenhower quadrants.
 */
@CapacitorPlugin(
    name = "HabitaCalendar",
    permissions = {
        @Permission(
            alias = CalendarPlugin.CALENDAR,
            strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR }
        )
    }
)
public class CalendarPlugin extends Plugin {

    static final String CALENDAR = "calendar";

    /** Marks events this app owns, so we never touch anything the user created. */
    private static final String OWNER_TAG = "habita";

    private static final String[] CALENDAR_FIELDS = new String[] {
        CalendarContract.Calendars._ID,
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
        CalendarContract.Calendars.ACCOUNT_NAME,
        CalendarContract.Calendars.ACCOUNT_TYPE,
        CalendarContract.Calendars.OWNER_ACCOUNT,
        CalendarContract.Calendars.CALENDAR_COLOR,
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
        CalendarContract.Calendars.IS_PRIMARY,
        CalendarContract.Calendars.VISIBLE
    };

    private static final String[] EVENT_FIELDS = new String[] {
        CalendarContract.Instances.EVENT_ID,
        CalendarContract.Instances.TITLE,
        CalendarContract.Instances.DESCRIPTION,
        CalendarContract.Instances.BEGIN,
        CalendarContract.Instances.END,
        CalendarContract.Instances.ALL_DAY,
        CalendarContract.Instances.CALENDAR_ID,
        CalendarContract.Instances.EVENT_COLOR,
        CalendarContract.Instances.EVENT_LOCATION
    };

    // ---------------------------------------------------------------- permissions

    /** Ask for calendar access, resolving with the outcome either way. */
    @PluginMethod
    public void ensurePermission(PluginCall call) {
        if (hasCalendarAccess()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias(CALENDAR, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasCalendarAccess());
        call.resolve(result);
    }

    private boolean hasCalendarAccess() {
        return getPermissionState(CALENDAR) == com.getcapacitor.PermissionState.GRANTED;
    }

    /**
     * Reject the call if permission is missing.
     *
     * @return true when the caller may proceed.
     */
    private boolean requireAccess(PluginCall call) {
        if (hasCalendarAccess()) return true;
        call.reject("Calendar permission has not been granted", "PERMISSION_DENIED");
        return false;
    }

    // ------------------------------------------------------------------ calendars

    /**
     * The calendar to write to when the user has not picked one.
     *
     * Preference order: the primary calendar, then any visible writable one,
     * then any writable one at all. Resolves with {@code null} if the device has
     * no writable calendar (rare, but possible on a freshly wiped phone with no
     * account signed in).
     */
    @PluginMethod
    public void getDefaultCalendar(PluginCall call) {
        if (!requireAccess(call)) return;

        ContentResolver resolver = getContext().getContentResolver();
        JSObject best = null;
        int bestScore = -1;

        try (Cursor cursor = resolver.query(
            CalendarContract.Calendars.CONTENT_URI, CALENDAR_FIELDS, null, null, null
        )) {
            while (cursor != null && cursor.moveToNext()) {
                boolean writable =
                    cursor.getInt(6) >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
                if (!writable) continue;

                boolean primary = cursor.getInt(7) == 1;
                boolean visible = cursor.getInt(8) == 1;
                int score = (primary ? 4 : 0) + (visible ? 2 : 0) + 1;
                if (score <= bestScore) continue;

                bestScore = score;
                best = new JSObject();
                best.put("id", String.valueOf(cursor.getLong(0)));
                best.put("name", cursor.getString(1));
                best.put("accountName", cursor.getString(2));
                best.put("color", colorToHex(cursor.getInt(5)));
                best.put("primary", primary);
                best.put("writable", true);
                best.put("visible", visible);
            }
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
            return;
        }

        JSObject result = new JSObject();
        result.put("calendar", best);
        call.resolve(result);
    }

    /**
     * Every writable calendar on the device, so the user can pick which one
     * Habita blocks time in. Same shape as {@link #getDefaultCalendar}, primary
     * first then visible ones, for a sensible order in the picker.
     */
    @PluginMethod
    public void listCalendars(PluginCall call) {
        if (!requireAccess(call)) return;

        ContentResolver resolver = getContext().getContentResolver();
        JSArray calendars = new JSArray();

        try (Cursor cursor = resolver.query(
            CalendarContract.Calendars.CONTENT_URI, CALENDAR_FIELDS,
            null, null,
            CalendarContract.Calendars.IS_PRIMARY + " DESC, "
                + CalendarContract.Calendars.VISIBLE + " DESC, "
                + CalendarContract.Calendars.CALENDAR_DISPLAY_NAME + " ASC"
        )) {
            while (cursor != null && cursor.moveToNext()) {
                boolean writable =
                    cursor.getInt(6) >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
                if (!writable) continue;

                JSObject cal = new JSObject();
                cal.put("id", String.valueOf(cursor.getLong(0)));
                cal.put("name", cursor.getString(1));
                cal.put("accountName", cursor.getString(2));
                cal.put("color", colorToHex(cursor.getInt(5)));
                cal.put("primary", cursor.getInt(7) == 1);
                cal.put("writable", true);
                cal.put("visible", cursor.getInt(8) == 1);
                calendars.put(cal);
            }
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
            return;
        }

        JSObject result = new JSObject();
        result.put("calendars", calendars);
        call.resolve(result);
    }

    // --------------------------------------------------------------------- events

    /**
     * Events overlapping [start, end).
     *
     * Queries the Instances table rather than Events so recurring events are
     * expanded into the concrete occurrences the timeline has to draw.
     *
     * @param start epoch millis, inclusive
     * @param end   epoch millis, exclusive
     * @param calendarId optional; omit for every calendar
     */
    @PluginMethod
    public void listEvents(PluginCall call) {
        if (!requireAccess(call)) return;

        Long start = call.getLong("start");
        Long end = call.getLong("end");
        if (start == null || end == null) {
            call.reject("start and end (epoch millis) are required", "INVALID_ARGUMENT");
            return;
        }
        if (end <= start) {
            call.reject("end must be after start", "INVALID_ARGUMENT");
            return;
        }
        String calendarId = call.getString("calendarId");

        Uri.Builder builder = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(builder, start);
        ContentUris.appendId(builder, end);

        String selection = null;
        String[] selectionArgs = null;
        if (!TextUtils.isEmpty(calendarId)) {
            selection = CalendarContract.Instances.CALENDAR_ID + " = ?";
            selectionArgs = new String[] { calendarId };
        }

        JSArray events = new JSArray();
        try (Cursor cursor = getContext().getContentResolver().query(
            builder.build(),
            EVENT_FIELDS,
            selection,
            selectionArgs,
            CalendarContract.Instances.BEGIN + " ASC"
        )) {
            while (cursor != null && cursor.moveToNext()) {
                JSObject event = new JSObject();
                event.put("id", String.valueOf(cursor.getLong(0)));
                event.put("title", cursor.getString(1));
                String description = cursor.getString(2);
                event.put("description", description);
                event.put("start", cursor.getLong(3));
                event.put("end", cursor.getLong(4));
                event.put("allDay", cursor.getInt(5) == 1);
                event.put("calendarId", String.valueOf(cursor.getLong(6)));
                event.put("color", cursor.isNull(7) ? null : colorToHex(cursor.getInt(7)));
                event.put("location", cursor.getString(8));
                // Lets the timeline tell its own blocks apart from everything else.
                event.put("isHabita", description != null && description.contains(taggedMarker()));
                events.put(event);
            }
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
            return;
        }

        JSObject result = new JSObject();
        result.put("events", events);
        call.resolve(result);
    }

    /**
     * Create an event and return its id.
     *
     * @param calendarId target calendar
     * @param title      event title
     * @param start      epoch millis
     * @param end        epoch millis
     * @param color      optional "#rrggbb" tint
     * @param taskId     optional Habita task id, embedded so the pairing survives
     *                   the user editing the event elsewhere
     */
    @PluginMethod
    public void createEvent(PluginCall call) {
        if (!requireAccess(call)) return;

        String calendarId = call.getString("calendarId");
        String title = call.getString("title");
        Long start = call.getLong("start");
        Long end = call.getLong("end");
        if (TextUtils.isEmpty(calendarId) || start == null || end == null) {
            call.reject("calendarId, start and end are required", "INVALID_ARGUMENT");
            return;
        }
        if (end <= start) {
            call.reject("end must be after start", "INVALID_ARGUMENT");
            return;
        }

        ContentValues values = new ContentValues();
        values.put(CalendarContract.Events.CALENDAR_ID, Long.parseLong(calendarId));
        values.put(CalendarContract.Events.TITLE, title == null ? "Task" : title);
        values.put(CalendarContract.Events.DTSTART, start);
        values.put(CalendarContract.Events.DTEND, end);
        values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
        values.put(CalendarContract.Events.DESCRIPTION, describe(call));
        values.put(CalendarContract.Events.HAS_ALARM, 0);

        applyColor(values, calendarId, call.getString("color"));

        // Attribute the event to the calendar's own account so the sync adapter
        // (Google, Exchange, …) uploads it instead of leaving an unsynced local
        // row. Account name/type are provider-only columns: the ONLY legal way to
        // set them is as query params on a sync-adapter URI. We do NOT set a
        // _SYNC_ID, so the row is still born DIRTY and Google uploads it normally.
        Uri insertUri = CalendarContract.Events.CONTENT_URI;
        String[] account = accountForCalendar(calendarId);
        if (account != null) {
            insertUri = CalendarContract.Events.CONTENT_URI.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Events.ACCOUNT_NAME, account[0])
                .appendQueryParameter(CalendarContract.Events.ACCOUNT_TYPE, account[1])
                .build();
        }

        try {
            Uri uri = getContext().getContentResolver().insert(insertUri, values);
            if (uri == null || uri.getLastPathSegment() == null) {
                call.reject("The calendar provider refused the event", "INSERT_FAILED");
                return;
            }
            JSObject result = new JSObject();
            result.put("eventId", uri.getLastPathSegment());
            call.resolve(result);
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
        } catch (IllegalArgumentException e) {
            call.reject("Could not create the event: " + e.getMessage(), "INSERT_FAILED", e);
        }
    }

    /**
     * Update an existing event in place.
     *
     * Only the fields present in the call are written, so moving a block on the
     * timeline does not clobber a description the user edited in their calendar
     * app. Resolves with {@code updated: false} when the event no longer exists
     * -- the caller treats that as "recreate it" rather than as an error, since
     * the user may well have deleted it from the other side.
     */
    @PluginMethod
    public void updateEvent(PluginCall call) {
        if (!requireAccess(call)) return;

        String eventId = call.getString("eventId");
        if (TextUtils.isEmpty(eventId)) {
            call.reject("eventId is required", "INVALID_ARGUMENT");
            return;
        }

        ContentValues values = new ContentValues();
        if (call.getString("title") != null) {
            values.put(CalendarContract.Events.TITLE, call.getString("title"));
        }
        Long start = call.getLong("start");
        Long end = call.getLong("end");
        if (start != null) values.put(CalendarContract.Events.DTSTART, start);
        if (end != null) values.put(CalendarContract.Events.DTEND, end);
        if (start != null || end != null) {
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
        }
        if (call.getString("description") != null || call.getString("taskId") != null) {
            values.put(CalendarContract.Events.DESCRIPTION, describe(call));
        }
        String color = call.getString("color");
        if (color != null) applyColor(values, findCalendarIdFor(eventId), color);

        if (values.size() == 0) {
            call.reject("Nothing to update", "INVALID_ARGUMENT");
            return;
        }

        Uri uri = ContentUris.withAppendedId(
            CalendarContract.Events.CONTENT_URI, Long.parseLong(eventId)
        );
        try {
            int rows = getContext().getContentResolver().update(uri, values, null, null);
            JSObject result = new JSObject();
            result.put("updated", rows > 0);
            call.resolve(result);
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
        }
    }

    /** Delete an event; resolves with {@code deleted: false} if it was already gone. */
    @PluginMethod
    public void deleteEvent(PluginCall call) {
        if (!requireAccess(call)) return;

        String eventId = call.getString("eventId");
        if (TextUtils.isEmpty(eventId)) {
            call.reject("eventId is required", "INVALID_ARGUMENT");
            return;
        }
        Uri uri = ContentUris.withAppendedId(
            CalendarContract.Events.CONTENT_URI, Long.parseLong(eventId)
        );
        try {
            int rows = getContext().getContentResolver().delete(uri, null, null);
            JSObject result = new JSObject();
            result.put("deleted", rows > 0);
            call.resolve(result);
        } catch (SecurityException e) {
            call.reject("Calendar permission was revoked", "PERMISSION_DENIED", e);
        }
    }

    // ---------------------------------------------------------------------- colour

    /**
     * Set a per-event colour.
     *
     * Calendar providers prefer {@code EVENT_COLOR_KEY}, which references a
     * palette entry the account already defines, and some ignore a raw
     * {@code EVENT_COLOR}. So look for the closest palette colour first and fall
     * back to writing the literal value.
     */
    private void applyColor(ContentValues values, String calendarId, String hexColor) {
        Integer color = parseHexColor(hexColor);
        if (color == null) return;

        String key = findClosestColorKey(calendarId, color);
        if (key != null) {
            values.put(CalendarContract.Events.EVENT_COLOR_KEY, key);
        } else {
            values.put(CalendarContract.Events.EVENT_COLOR, color);
        }
    }

    /**
     * The account palette key whose colour is nearest {@code target}, or null if
     * the account publishes no event palette.
     */
    private String findClosestColorKey(String calendarId, int target) {
        if (TextUtils.isEmpty(calendarId)) return null;

        String accountName = null;
        String accountType = null;
        try (Cursor cursor = getContext().getContentResolver().query(
            ContentUris.withAppendedId(
                CalendarContract.Calendars.CONTENT_URI, Long.parseLong(calendarId)
            ),
            new String[] {
                CalendarContract.Calendars.ACCOUNT_NAME,
                CalendarContract.Calendars.ACCOUNT_TYPE
            },
            null, null, null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                accountName = cursor.getString(0);
                accountType = cursor.getString(1);
            }
        } catch (SecurityException | NumberFormatException e) {
            return null;
        }
        if (accountName == null || accountType == null) return null;

        String best = null;
        long bestDistance = Long.MAX_VALUE;
        try (Cursor cursor = getContext().getContentResolver().query(
            CalendarContract.Colors.CONTENT_URI,
            new String[] {
                CalendarContract.Colors.COLOR_KEY,
                CalendarContract.Colors.COLOR
            },
            CalendarContract.Colors.ACCOUNT_NAME + " = ? AND "
                + CalendarContract.Colors.ACCOUNT_TYPE + " = ? AND "
                + CalendarContract.Colors.COLOR_TYPE + " = ?",
            new String[] {
                accountName,
                accountType,
                String.valueOf(CalendarContract.Colors.TYPE_EVENT)
            },
            null
        )) {
            while (cursor != null && cursor.moveToNext()) {
                long distance = colorDistance(target, cursor.getInt(1));
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = cursor.getString(0);
                }
            }
        } catch (SecurityException e) {
            return null;
        }
        return best;
    }

    /** Squared distance in RGB space -- crude, but enough to pick a palette slot. */
    private static long colorDistance(int a, int b) {
        long dr = ((a >> 16) & 0xFF) - ((b >> 16) & 0xFF);
        long dg = ((a >> 8) & 0xFF) - ((b >> 8) & 0xFF);
        long db = (a & 0xFF) - (b & 0xFF);
        return dr * dr + dg * dg + db * db;
    }

    private static Integer parseHexColor(String hex) {
        if (TextUtils.isEmpty(hex)) return null;
        String value = hex.startsWith("#") ? hex.substring(1) : hex;
        if (value.length() == 3) {
            // #abc -> #aabbcc
            StringBuilder expanded = new StringBuilder();
            for (int i = 0; i < 3; i++) expanded.append(value.charAt(i)).append(value.charAt(i));
            value = expanded.toString();
        }
        if (value.length() != 6) return null;
        try {
            return 0xFF000000 | Integer.parseInt(value, 16);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String colorToHex(int color) {
        return String.format("#%06X", 0xFFFFFF & color);
    }

    // ----------------------------------------------------------------- description

    /** The marker embedded in descriptions so Habita recognises its own events. */
    private String taggedMarker() {
        return "[" + OWNER_TAG + ":";
    }

    /**
     * Build the event description, appending the task-id marker.
     *
     * The marker is what lets a reinstall (or a cleared cache) still recognise
     * which calendar events belong to which task.
     */
    private String describe(PluginCall call) {
        String description = call.getString("description");
        String taskId = call.getString("taskId");
        StringBuilder out = new StringBuilder();
        if (!TextUtils.isEmpty(description)) out.append(description).append("\n\n");
        out.append(taggedMarker()).append(taskId == null ? "" : taskId).append("]");
        return out.toString();
    }

    /**
     * The [accountName, accountType] a calendar belongs to, or null if unknown.
     *
     * Events created by a normal app must carry the target calendar's account so
     * the Google (or other) sync adapter recognises them as its own and uploads
     * them. Without it the row is created locally, stays DIRTY, and never leaves
     * the phone -- exactly the "event never appears in Google Calendar" symptom.
     */
    private String[] accountForCalendar(String calendarId) {
        if (TextUtils.isEmpty(calendarId)) return null;
        try (Cursor cursor = getContext().getContentResolver().query(
            ContentUris.withAppendedId(
                CalendarContract.Calendars.CONTENT_URI, Long.parseLong(calendarId)
            ),
            new String[] {
                CalendarContract.Calendars.ACCOUNT_NAME,
                CalendarContract.Calendars.ACCOUNT_TYPE
            },
            null, null, null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                String type = cursor.getString(1);
                if (name != null && type != null) return new String[] { name, type };
            }
        } catch (SecurityException | NumberFormatException e) {
            return null;
        }
        return null;
    }

    /** The calendar an existing event lives in, or null if it has gone. */
    private String findCalendarIdFor(String eventId) {
        try (Cursor cursor = getContext().getContentResolver().query(
            ContentUris.withAppendedId(
                CalendarContract.Events.CONTENT_URI, Long.parseLong(eventId)
            ),
            new String[] { CalendarContract.Events.CALENDAR_ID },
            null, null, null
        )) {
            if (cursor != null && cursor.moveToFirst()) return String.valueOf(cursor.getLong(0));
        } catch (SecurityException | NumberFormatException e) {
            return null;
        }
        return null;
    }
}
